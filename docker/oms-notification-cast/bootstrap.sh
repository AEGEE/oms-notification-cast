#!/bin/bash

if [ ! -f lib/config/config.json ] 
then
  cp lib/config/config.json.example lib/config/config.json 
fi

npm install --loglevel warn