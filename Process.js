#!/bin/bash
cd $(dirname "$0")

LCNAME="soundjs"
cd ./build # change to build dir
echo -n "Version number? (x.x.x): "
read VERSION
if [ "$VERSION" == "" ] 
then
	VERSION="NEXT";
fi   

echo -n "Copy files? (y / n): "
read COPY

if [ "$COPY" == "" ] 
then
	COPY="y";
fi 

echo -n "Building $NAME version: $VERSION"
node ./build.js --tasks=ALL --version=$VERSION -v # run the build

if [ "$COPY" == "y" ] # spaces are important!
then
	echo "Copying source and docs"
	mv -f "./output/${LCNAME}-${VERSION}.min.js" ../lib
fi
echo "Complete"
