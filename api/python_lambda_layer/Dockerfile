FROM public.ecr.aws/lambda/python:3.11

RUN yum update -y && \
  yum install -y \
    gcc \
    gcc-c++ \
    python39-devel \
    atlas-devel \
    atlas-sse3-devel \
    blas-devel \
    lapack-devel \
    zlib-devel \
    libpng-devel \
    libjpeg-turbo-devel \
    zip \
    freetype-devel \
    findutils \
    libtiff \
    libtiff-devel

RUN pip install --upgrade pip

ENTRYPOINT ["bash","-l","-c"]
