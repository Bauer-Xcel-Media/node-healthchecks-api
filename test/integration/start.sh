#!/bin/bash

# npm install

rm -rf ./temp
mkdir temp

cp -R ../../lib ./temp
cp -R ../../index.js ./temp
cp -R ../../package.json ./temp

docker build . -t health-check-test-service:latest

docker-compose up -d