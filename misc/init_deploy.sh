#! /bin/sh

REPO_URL=https://github.com/nime42/tipsy.git
REPO_DIR=tipsy
TARGET_DIR=~/
git clone $REPO_URL
mv $REPO_DIR $TARGET_DIR/
cd $TARGET_DIR/$REPO_DIR
npm install
npm run initDB
