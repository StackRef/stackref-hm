#!/usr/bin/env python3

import asyncio
import json
import numpy as np
import os
import sys
from binaryornot.check import is_binary
from langchain.callbacks import get_openai_callback
from langchain.chains.summarize import load_summarize_chain
from langchain.chat_models import ChatAnthropic, ChatOpenAI
from langchain.docstore.document import Document
from langchain.document_loaders import GitLoader
from langchain.embeddings import OpenAIEmbeddings, SentenceTransformerEmbeddings
from langchain.output_parsers import OutputFixingParser, PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain.schema import OutputParserException
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pydantic import BaseModel, Field
from rich.console import Console
from rich.pretty import pprint
from rich.progress import BarColumn, MofNCompleteColumn, Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from sklearn.cluster import KMeans


os.environ["TOKENIZERS_PARALLELISM"] = "false"

class Scores(BaseModel):
    security: int = Field(description="Your Security score 1-10 (10 = most secure)", gt=0, lt=11)
    code_smells: int = Field(description="Your Code Smells score 1-10 (10 = least smells)", gt=0, lt=11)
    complexity: int = Field(description="Your Complexity score 1-10 (10 = least complex)", gt=0, lt=11)

class Cossell(BaseModel):
    code_summary: str = Field(description="Your summary of all provided code in strictly under 800 characters")
    commentary: str = Field(description="Your commentary on all provided source code in strictly under 800 characters")
    scores: Scores


def is_text_file(file_path):
    return not is_binary(file_path)


def git_loader():
    data = None
    try:
        loader = GitLoader(repo_path=dir_path, branch=repo_branch, file_filter=is_text_file)
        data = loader.load()
    except Exception:
        console.print_exception(show_locals=True)
        raise
    
    return data


async def process_snippet(i, snippet, selected_snippets, selected_indices, llm, map_chain):
    try:
        #tokens = llm.get_num_tokens(snippet.page_content)
        #print(f":: Running summary #{i+1} of {len(selected_snippets)} (chunk #{selected_indices[i]} - {tokens} tokens) ...")
        chunk_summary = await asyncio.wait_for(map_chain.arun([snippet]), 120)
        return chunk_summary
    except asyncio.TimeoutError:
        print(f'>> Timeout: (chunk #{selected_indices[i]}) took too long')
        return ''
    except Exception as error:
        print(f'>> (chunk #{selected_indices[i]}) {error}')
        return ''


async def process_all_snippets(selected_snippets, selected_indices, api_name, map_chain):
    llm = get_llm(api_name)

    max_concurrent = 10
    if api_name == 'anthropic':
        max_concurrent = 2

    # Create a semaphore with a maximum of max_concurrent tasks
    semaphore = asyncio.Semaphore(max_concurrent)

    async def __process_with_semaphore(i, snippet):
        # Acquire the semaphore
        async with semaphore:
            return await process_snippet(i, snippet, selected_snippets, selected_indices, llm, map_chain)

    coros = [__process_with_semaphore(i, snippet) for i, snippet in enumerate(selected_snippets)]
    summary_list = []

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), BarColumn(), MofNCompleteColumn(), TimeElapsedColumn()) as progress:
        total_snippets = len(coros)
        task = progress.add_task("[cyan]Processing snippets ...", total=total_snippets)

        for idx, f in enumerate(asyncio.as_completed(coros), start=1):
            result = await f
            summary_list.append(result)
            progress.update(task, advance=1)

    return summary_list


def extract_snippets():
    snippets = []

    try:
        with console.status(f"Splitting code from [cyan]'{repo_branch}'[/cyan] branch in [cyan]'{dir_path}'[/cyan] ..."):
            data = git_loader()
            code_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=0, separators=['\n\n','\n',' ',';',',',''])
            snippets = code_splitter.split_documents(data)
            num_snippets = len(snippets)
        console.print(f":white_check_mark: Splitting code from [cyan]'{repo_branch}'[/cyan] branch in [cyan]'{dir_path}'[/cyan] ... ([green]{num_snippets}[/green] snippets)")
    except Exception:
        console.print_exception(show_locals=True)
        raise

    return snippets


def create_embeddings_vectors(snippets, api_name):
    vectors = None

    try:
        with console.status('Creating embeddings ...', spinner="dots") as status:
            embeddings = SentenceTransformerEmbeddings()
            if api_name == 'openai':
                embeddings = OpenAIEmbeddings(chunk_size=1000)
            vectors = embeddings.embed_documents([x.page_content for x in snippets])
            console.print(":white_check_mark: Creating embeddings ... [green]Done![/green]")
    except Exception:
        console.print_exception(show_locals=True)
        raise

    return vectors


def calculate_kmeans(snippets, vectors, num_clusters):
    num_snippets = len(snippets)
    selected_indices = []
    selected_snippets = []

    try:
        with console.status('Calculating KMeans for de-duplication ...', spinner="dots") as status:
            if num_snippets <= num_clusters:
                num_clusters = num_snippets
            kmeans = KMeans(n_init='auto', n_clusters=num_clusters, random_state=42).fit(vectors)
            #print(kmeans.labels_)
            closest_indices = []

            # Loop through the number of clusters you have
            for i in range(num_clusters):

                # Get the list of distances from that particular cluster center
                distances = np.linalg.norm(vectors - kmeans.cluster_centers_[i], axis=1)

                # Find the list position of the closest one (using argmin to find the smallest distance)
                closest_index = np.argmin(distances)

                # Append that position to your closest indices list
                closest_indices.append(closest_index)
            selected_indices = sorted(closest_indices)
            selected_snippets = [snippets[snippet] for snippet in selected_indices]
            #print(selected_indices)
            #print(selected_texts)
            console.print(":white_check_mark: Calculating KMeans for de-duplication ... [green]Done![/green]")
    except Exception:
        console.print_exception(show_locals=True)
        raise

    return selected_indices, selected_snippets


def get_llm(api_name, type='map'):
    llm = None

    if api_name == 'anthropic':
        llm = ChatAnthropic(temperature=0, model_name='claude-2.1')
    elif api_name == 'openai':
        if type == 'reduce':
            llm = ChatOpenAI(temperature=0, model_name='gpt-4-1106-preview')
        else:
            llm = ChatOpenAI(temperature=0, model_name='gpt-3.5-turbo-1106')
    else:
        raise ValueError(f'Invalid API name: {api_name}')
    
    return llm


def get_map_reduce_chain(type, api_name, prompt_template):
    chain = None

    llm = get_llm(api_name, type)

    chain = load_summarize_chain(llm=llm,
        chain_type="stuff",
        prompt=prompt_template
    )

    return chain


def get_summaries(selected_snippets, selected_indices, api_name):
    summaries = None
    map_chain = get_map_reduce_chain('map', api_name, map_prompt_template)
    summary_list = asyncio.run(process_all_snippets(selected_snippets, selected_indices, api_name, map_chain))

    none_count = len([summary for summary in summary_list if summary is None])
    if none_count > 0:
        console.print(f'[red]:police_car_light: {none_count} snippet(s) produced an error and were not processed, likely due to a token count too high for the LLM.[/red]')
        raise ValueError(f'Error processing {none_count} snippets')

    summaries = "\n".join(summary for summary in summary_list if summary is not None)

    return summaries


def get_parser(api_name, parser=None):
    new_parser = PydanticOutputParser(pydantic_object=Cossell)

    if parser:
        llm = get_llm(api_name, 'reduce')
        new_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)

    return new_parser


def process_combined_summaries(summaries, api_name):
    parser = get_parser(api_name)

    combine_prompt = """You will be given a series of summaries and commentaries of source code. The summaries and commentaries will be enclosed within the markers [COSSELL] and [/COSSELL].
Your goal is to give a very general overview of what all the combined source code does and how well it is coded.
The reader should be able to understand, at a high level, what the entire source code achieves.

[COSSELL]
{text}
[/COSSELL]

{format_instructions}

SUMMARY, COMMENTARY AND SCORES:"""

    combine_prompt_template = PromptTemplate(
        template=combine_prompt,
        input_variables=["text"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    with console.status('Processing combined summaries ...', spinner="dots") as status:
        # Convert it back to a document
        summaries = Document(page_content=summaries)

        #print (f"::   Total summary has {llm3.get_num_tokens(summaries.page_content)} tokens")

        reduce_chain = get_map_reduce_chain('reduce', api_name, combine_prompt_template)

        if api_name == 'openai':
            with get_openai_callback() as cb:
                try:
                    response = reduce_chain.run([summaries])
                    token_usage = {
                        "total_tokens": cb.total_tokens,
                        "prompt_tokens": cb.prompt_tokens,
                        "completion_tokens": cb.completion_tokens,
                        "total_cost": cb.total_cost
                    }
                except Exception:
                    console.print_exception(show_locals=True)
                    raise
        else:
            try:
                token_usage = {}
                response = reduce_chain.run([summaries])
            except Exception:
                console.print_exception(show_locals=True)
                raise

        console.print(":white_check_mark: Processing combined summaries ... [green]Done![/green]")

    try:
        if response:
            with console.status('Checking response format ...', spinner="dots") as status:
                output = None
                for i in range(max_fix_attempts):
                    try:
                        if i == 0:
                            parser_to_use = parser
                        else:
                            parser_to_use = get_parser(api_name, parser_to_use)
                        output = parser_to_use.parse(response)
                        break
                    except OutputParserException:
                        if i == max_fix_attempts - 1:
                            console.print('[red]:police_car_light: Response not in proper format. Unable to fix.[/red]')
                            raise ValueError(f'Response not in proper format. Unable to fix.')
                        else:
                            #print(response)
                            console.print(f'[cyan]:arrows_counterclockwise: Response not in proper format. Attempting fix {i + 1} of {max_fix_attempts} ...[/cyan]')
                    except Exception:
                        raise
            if output:
                console.print(':white_check_mark: Checking response format ... [green]Looks good![/green] :fireworks:')
                try:
                    json_output = output.model_dump()
                    json_output['token_usage'] = token_usage
                    with console.status(f"Writing output to [cyan]'{results_output_file}'[/cyan] ...") as status:
                        with open(results_output_file, 'w') as file:
                            json.dump(json_output, file, indent=2)
                    console.print(f":white_check_mark: Writing output to [cyan]'{results_output_file}'[/cyan] ... [green]Done![/green]")
                    pprint(json_output, expand_all=True)
                except Exception as error:
                    raise error
            console.print(':chequered_flag: [green]FINISH LINE[/green] :chequered_flag:')
        else:
            console.print('[red]:police_car_light: No response received[/red]')
            raise ValueError(f'No response received')
    except Exception:
        console.print_exception(show_locals=True)
        raise


def process_with_anthropic(snippets):
    console.print(f":: Attempting processing with [cyan]anthropic[/cyan] ...")
    try:
        vectors = create_embeddings_vectors(snippets, 'anthropic')
        selected_indices, selected_snippets = calculate_kmeans(snippets, vectors, num_clusters) 
        summaries = get_summaries(selected_snippets, selected_indices, 'anthropic')
        process_combined_summaries(summaries, 'anthropic')
    except Exception:
        console.print_exception(show_locals=True)
        raise


def process_with_openai(snippets):
    console.print(f":: Attempting processing with [cyan]openai[/cyan] ...")
    try:
        vectors = create_embeddings_vectors(snippets, 'openai')
        selected_indices, selected_snippets = calculate_kmeans(snippets, vectors, num_clusters) 
        summaries = get_summaries(selected_snippets, selected_indices, 'openai')
        process_combined_summaries(summaries, 'openai')
    except Exception:
        console.print_exception(show_locals=True)
        raise

'''
    main
'''

def main():
    global results_output_file
    global max_fix_attempts
    global map_prompt_template
    global num_clusters
    global dir_path
    global repo_branch
    global console

    if len(sys.argv) > 1:
        dir_path = sys.argv[1]
    else:
        raise ValueError('No path to source code provided')

    if len(sys.argv) > 2:
        repo_branch = sys.argv[2]
    else:
        repo_branch = 'main'

    console = Console()

    map_prompt = """You will be given a snippet of source code. This snippet will be enclosed within the markers [COSSELL] and [/COSSELL].
Your goal is to give a detailed summary of this snippet so that a reader will understand what the code does.
Your response should detail what the code does and give commentary on how well it was written.

[COSSELL]
{text}
[/COSSELL]

SUMMARY AND COMMENTARY:"""

    map_prompt_template = PromptTemplate(template=map_prompt, input_variables=["text"])

    results_output_file = '/tmp/cossell-output.json'
    max_tokens = 1000
    max_fix_attempts = 5
    num_clusters = 20

    snippets = extract_snippets()

    #process_with_openai(snippets)
    #process_with_anthropic(snippets)

    try:
        process_with_openai(snippets)
    except Exception:
        try:
            process_with_anthropic(snippets)
        except Exception:
            raise


if __name__ == "__main__":
    main()
    sys.exit(0)
