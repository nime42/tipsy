#! /bin/sh
WDIR=`dirname $0`

REPO_URL=https://github.com/nime42/tipsy.git
REPO_DIR=$WDIR/tipsy
TARGET_DIR=~/tipsy
rm -rf $REPO_DIR
git clone $REPO_URL $REPO_DIR
$WDIR/git_autotag.sh $REPO_DIR
rm -rf $TARGET_DIR/public $TARGET_DIR/app
cp -r $REPO_DIR/public $REPO_DIR/app $REPO_DIR/package.json $TARGET_DIR/
cp -r $REPO_DIR/resources/create_demo.sql $TARGET_DIR/resources
rm -rf $REPO_DIR
cd $TARGET_DIR/
npm update
npm run shutdown
nohup npm run start 2>&1 &



