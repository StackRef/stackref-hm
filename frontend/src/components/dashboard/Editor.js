import EditorTheme from 'src/theme/EditorTheme';
import { $getRoot, $getSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import ToolbarPlugin from 'src/plugins/editor-plugins/ToolbarPlugin';
import MaxLengthPlugin from 'src/plugins/editor-plugins/MaxLengthPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { TRANSFORMERS } from '@lexical/markdown';

import ListMaxIndentLevelPlugin from 'src/plugins/editor-plugins/ListMaxIndentLevelPlugin';
import CodeHighlightPlugin from 'src/plugins/editor-plugins/CodeHighlightPlugin';
import AutoLinkPlugin from 'src/plugins/editor-plugins/AutoLinkPlugin';

import { Divider } from '@mui/material';

const EDITOR_NAMESPACE = 'lexical-editor';

function Placeholder(props) {
  return <div className='editor-placeholder'>{props.placeholderText}</div>;
}

export function LexicalEditor(props) {
  return (
    <LexicalComposer initialConfig={props.config}>
      <div className='editor-container'>
        {props.config.editable ? (
          <>
            <ToolbarPlugin />
            <Divider />
          </>
        ) : null}
        <div className='editor-inner'>
          <RichTextPlugin
            contentEditable={<ContentEditable className='editor-input' />}
            placeholder={
              <Placeholder placeholderText={props.placeholderText} />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin
            onChange={props.onChange}
            ignoreSelectionChange={true}
          />
          <MaxLengthPlugin maxLength={10000} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <CodeHighlightPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
  );
}

const editorConfig = {
  namespace: EDITOR_NAMESPACE,
  // The editor theme
  theme: EditorTheme,
  // Handling of errors during update
  onError(error) {
    console.error(`>> ${error}`);
    throw error;
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
  ],
};

export default function Editor({ ...props }) {
  return (
    <LexicalEditor
      config={{
        ...editorConfig,
        editorState: props.editorState,
        editable: props.editable || false,
      }}
      onChange={props.onChange}
      placeholderText={props.placeholderText}
    />
  );
}
