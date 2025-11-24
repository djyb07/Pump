#!/bin/bash
cd /home/site/wwwroot
npm install
npm run build
node dist/app.js
