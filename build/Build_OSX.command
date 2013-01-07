#!/bin/bash
cd $(dirname "$0")

LCNAME="soundjs"

echo -e "\r--- $LCNAME ---"
echo -n "Version number (x.x.x) ?  Defaults to 'NEXT' : "
read VERSION
if [ "$VERSION" == "" ] 
then
	VERSION="NEXT";
fi   

echo -n "Copy files (y / n) ?  Defaults to 'y' : "
read COPY

if [ "$COPY" == "" ] 
then
	COPY="y";
fi 

echo -n "Building $LCNAME version: $VERSION"
node ./build.js --tasks=ALL --version=$VERSION -v # run the build

if [ "$COPY" == "y" ] # spaces are important!
then
	echo -n "Copying source and docs"
	mv -f "./output_min/${LCNAME}-${VERSION}.min.js" ../lib
else 
    mv -f "./output_min/${LCNAME}-${VERSION}.min.js" ./output
fi
rm -rf "./output_min"
echo -e "\r"
echo "Complete"
