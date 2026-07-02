FROM public.ecr.aws/codebuild/amazonlinux2-x86_64-standard:4.0

ENV SR_COSSELL_VERSION="2.0.1"

LABEL Version="${SR_COSSELL_VERSION}"
LABEL stackref.maintainer="Keith McDuffee <keith@stackref.com>"
LABEL stackref.service_name="cossell"
LABEL stackref.service_version="${SR_COSSELL_VERSION}"

RUN yum upgrade -y && \
    yum install -y curl jq npm

# Install Infracost
RUN curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh

# Install Snyk
RUN npm install snyk -g

# Install SCC
RUN curl -sL -O https://github.com/boyter/scc/releases/download/v3.1.0/scc_3.1.0_Linux_x86_64.tar.gz
RUN tar xvfz scc_*.tar.gz -C /usr/local/bin && chmod +x /usr/local/bin/scc && rm -f scc_*.tar.gz

# Install Unlighthouse (https://unlighthouse.dev/)
RUN npm install -g @unlighthouse/cli puppeteer

# Install Cossell
COPY ./requirements.txt /tmp
RUN pip install -r /tmp/requirements.txt --no-cache-dir
RUN pip uninstall -y urllib3 && pip install urllib3==1.26.15
COPY ./cossell.py /usr/local/bin

# Cleanup
RUN yum remove npm -y
RUN yum clean all && \
    rm -rf /var/cache/yum
