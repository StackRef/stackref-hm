FROM alpine:latest

ARG BUILD_DATE

ENV AWS_NUKE_VERSION="2.24.2"

LABEL "stackref.maintainer"="Jordan Avery <admin@example.com>"
LABEL "stackref.service_name"="cleanup_crew"
LABEL "stackref.service_version"=${AWS_NUKE_VERSION}
LABEL "stackref.build_date"=${BUILD_DATE}

RUN apk add wget

RUN wget -c "https://github.com/rebuy-de/aws-nuke/releases/download/v${AWS_NUKE_VERSION}/aws-nuke-v${AWS_NUKE_VERSION}-linux-arm64.tar.gz" -O - | tar -xz -C /usr/local/bin
RUN chmod +x /usr/local/bin/aws-nuke-v${AWS_NUKE_VERSION}-linux-arm64
RUN ln -s /usr/local/bin/aws-nuke-v${AWS_NUKE_VERSION}-linux-arm64 /usr/local/bin/aws-nuke

RUN mkdir /root/.aws
COPY ./aws.config /root/.aws/config

RUN apk del wget

WORKDIR /mnt
ENTRYPOINT ["/usr/local/bin/aws-nuke"]
