#! /bin/sh

REPO_URL=https://github.com/nime42/tipsy.git
REPO_DIR=tipsy
TARGET_DIR=~/
rm -rf $REPO_DIR
git clone $REPO_URL
rm -rf $TARGET_DIR/$REPO_DIR/public $TARGET_DIR/$REPO_DIR/app
cp $REPO_DIR/public $REPO_DIR/app $TARGET_DIR/$REPO_DIR
npm update
