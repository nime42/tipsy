#! /bin/sh
WDIR=`dirname $0`

REPO_URL=https://github.com/nime42/tipsy.git
REPO_DIR=$WDIR/tipsy
TARGET_DIR=~/tipsy
git clone $REPO_URL
mv $REPO_DIR $TARGET_DIR/..
cd $TARGET_DIR/
npm install
npm run initDB
