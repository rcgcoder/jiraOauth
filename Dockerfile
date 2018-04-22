FROM node:latest

MAINTAINER RCGCoder <ricardo.cantabran@gmail.com>

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update 


RUN mkdir -p /usr/src
ADD app /usr/src/app
ADD config /usr/src/app/config

WORKDIR /usr/src/app
RUN npm install
RUN nodejs app.js


