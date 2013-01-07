#!/usr/bin/env node

// TODO: add support for recursively checking to see if we are ommiting any files


var FILE = require("fs");
var PATH = require("path");
var CHILD_PROCESS = require("child_process");
var OS = require("os");

//file system utils
var WRENCH = require("wrench");

//for parsing command line args
var OPTIMIST = require("optimist");

/************************************************************
CONFIGURATION
*/

var json = FILE.readFileSync(PATH.resolve("./config.json"), "UTF-8");
json = JSON.parse(json);
var config =json.config_soundjs;

var SOURCE_FILES = [];
// listing of all source files, with dependencies listed in order:
SOURCE_FILES = config.SOURCE_FILES;

// default name for lib output:
var JS_FILE_NAME = config.JS_FILE_NAME;
// project name:
var PROJECT_NAME = config.PROJECT_NAME;

// url for website or github repo for project:
var PROJECT_URL = config.PROJECT_URL;

// name of directory for docs:
var DOCS_DIR_NAME =  PROJECT_NAME + config.DOCS_DIR_NAME;

// name of file for zipped docs:
var DOCS_FILE_NAME = DOCS_DIR_NAME + config.DOCS_FILE_NAME

// name of directory where generated files are placed
var OUTPUT_DIR_NAME = __dirname + config.OUTPUT_DIR_NAME;

// path to directory that includes YUI Doc templates
var TEMPLATE_DIR_PATH = __dirname + config.TEMPLATE_DIR_PATH;

// tmp directory used when running scripts:
var TMP_DIR_NAME = __dirname + config.TMP_DIR_NAME;

// paths to tools:
var GOOGLE_CLOSURE_PATH =  __dirname + config.GOOGLE_CLOSURE_PATH;
var YUI_DOC_PATH =  __dirname + config.YUI_DOC_PATH;

// yui version being used
var YUI_VERSION = config.YUI_VERSION;

/*
END CONFIGURATION
************************************************************/

OPTIMIST.describe("v", "Enable verbose output")
	.alias("v", "verbose")
	.boolean("v")
	.describe("l", "List all available tasks")
	.alias("l", "list")
	.boolean("l")
	.describe("h", "Display usage")
	.alias("h", "help")
	.boolean("h")
	.describe("version", "Document build version number")
	.string("version")
	.describe("tasks", "Task to run")
	.default("tasks", "all")
	.describe("s","Include specified file in compilation. Option can be specified multiple times for multiple files.")
	.alias("s", "source")
	.describe("o", "Name of minified JavaScript file.")
	.alias("o", "output")
	.default("o", JS_FILE_NAME)
	.usage("Build Task Manager for "+PROJECT_NAME+"\nUsage\n$0 [-v] [-h] [-l] --tasks=TASK [--version=DOC_VERSION] [--source=FILE] [--output=FILENAME.js]");



//name of minified js file.
var js_file_name = JS_FILE_NAME;

var version;
var verbose;

var TASK = {
	ALL:"ALL",
	BUILDDOCS:"BUILDDOCS",
	BUILDSOURCE:"BUILDSOURCE",
	CLEAN:"CLEAN"
};

var extraSourceFiles;

//main entry point for script. Takes optimist argv object which
//contains command line arguments.
//This function is called at the bottom of the script
function main(argv)
{
	if(argv.h)
	{
		displayUsage();
		process.exit(0);
	}

	if(argv.l)
	{
		displayTasks();
		process.exit(0);
	}

	//default doesn't seem to be working for OPTIMIST right now
	//if task is not specified, we default to ALL
	var task = (!argv.tasks)?"ALL":argv.tasks.toUpperCase();

	if(!taskIsRecognized(task))
	{
		print("Unrecognized task : " + task);
		displayUsage();
		process.exit(1);
	}

	verbose = argv.v != undefined;
	version = argv.version;
	
	extraSourceFiles = argv.s;
	
	if(argv.o)
	{
		js_file_name = argv.o;
	}

	var shouldBuildSource = (task == TASK.BUILDSOURCE);
	var shouldBuildDocs = (task == TASK.BUILDDOCS);

	if(task==TASK.CLEAN)
	{
		cleanTask(
			function(success)
			{
				print("Clean Task Completed");
			}
		);
	}

	if(task == TASK.ALL)
	{	
		shouldBuildSource = true;
		shouldBuildDocs = true;
	}

	if(shouldBuildDocs && (version == undefined))
	{
		displayUsage();
		process.exit(0);
	}

	if(shouldBuildSource)
	{
		buildSourceTask(function(success)
		{		
			print("\nBuild Source Task Complete");
			if(shouldBuildDocs)
			{
				buildDocsTask(version,
					function(success)
					{
						print("Build Docs Task Complete");
					}
				);
			}

		});
	}

	if(shouldBuildDocs && task != "ALL")
	{
		buildDocsTask(version,
			function(success)
			{
				print("Build Docs Task Complete");
			}
		);
	}	
}


/********** TASKS *************/


function cleanTask(completeHandler)
{                                         
	if(FILE.existsSync(TMP_DIR_NAME))
	{	
		WRENCH.rmdirSyncRecursive(TMP_DIR_NAME);
	}
	  
	if(FILE.existsSync(OUTPUT_DIR_NAME))  
	{
		WRENCH.rmdirSyncRecursive(OUTPUT_DIR_NAME);
	}
}

function buildSourceTask(completeHandler)
{	        
	if(!FILE.existsSync(OUTPUT_DIR_NAME))
	{
		FILE.mkdirSync(OUTPUT_DIR_NAME);
	}
	
	js_file_name = js_file_name.split("%VERSION%").join(version);

	var file_args = [];
	var len = SOURCE_FILES.length;
	for(var i = 0; i < len; i++)
	{
		file_args.push("--js");
        var dirName = __dirname + SOURCE_FILES[i];
		file_args.push(dirName);
	}
	
	if(extraSourceFiles)
	{
		len = extraSourceFiles.length;
		for(var i = 0; i < len; i++)
		{
			file_args.push("--js");
			file_args.push(extraSourceFiles[i]);
		}
	}
	
	
	var tmp_file = PATH.join(OUTPUT_DIR_NAME,"tmp.js");
	var final_file = PATH.join(OUTPUT_DIR_NAME, js_file_name);

	var cmd = [
		"java", "-jar", GOOGLE_CLOSURE_PATH
	].concat(
			file_args
		).concat(
			["--js_output_file", tmp_file]
		);
		
    
	CHILD_PROCESS.exec(
		cmd.join(" "),
		function(error, stdout, stderr)
		{
			if(verbose)
			{
				if(stdout)
				{
					print(stdout);
				}
			
				if(stderr)
				{
					print(stderr);
				}
			}

		    if (error !== null)
			{
				print("Error Running Google Closure : " + error);
				exitWithFailure();
		    }
		
			var license_data = FILE.readFileSync(__dirname + "/license.txt", "UTF-8");
			var final_data = FILE.readFileSync(tmp_file, "UTF-8");

			FILE.writeFileSync(final_file, license_data + final_data, "UTF-8");

			FILE.unlinkSync(tmp_file);
			
			completeHandler(true);
		}
	);
}

function buildDocsTask(version, completeHandler)
{	
	var parser_in="../src";
	var	parser_out= PATH.join(TMP_DIR_NAME , "parser");

	var doc_dir=DOCS_DIR_NAME.split("%VERSION%").join(version);
	var doc_file=DOCS_FILE_NAME.split("%VERSION%").join(version);
	
	var generator_out=PATH.join(OUTPUT_DIR_NAME, doc_dir);
    
    var yuidocCommand = ["yuidoc -q --themedir ./createjsTheme --project-version", version];
    var zipCommand = "zip -rq " + "../docs/" + doc_file + " " + "output   " + "*.DS_Store";
    
    CHILD_PROCESS.exec(
		yuidocCommand.join(" "),
		function(error, stdout, stderr)
		{
			if(verbose)
			{
				if(stdout)
				{
					print(stdout);
				}
			
				if(stderr)
				{
					print(stderr);
				}
			}

		    if (error !== null)
			{
				print("Error Running YUI DOC : " + error);
				exitWithFailure();
		    }
		
			CHILD_PROCESS.exec(
				zipCommand,
				function(error, stdout, stderr)
				{
					if(verbose)
					{
						if(stdout)
						{
							print(stdout);
						}

						if(stderr)
						{
							print(stderr);
						}
					}

				    if (error !== null)
					{
						print("Error ZIPPING Docs : " + error);
						exitWithFailure();
				    }
					completeHandler(true);				
				});		
		
		
		});	
}

/*************** some util methods ******************/

function exitWithFailure()
{
	process.exit(1);
}

function displayUsage()
{
	print(OPTIMIST.help());
}

function displayTasks()
{
	var out = "Available tasks: ";
	
	for(var _t in TASK)
	{
		out += TASK[_t] +", "
	}
	
	print(out.slice(0, -2));
}

function taskIsRecognized(task)
{
	return TASK.hasOwnProperty(task);
}

function print(msg)
{
	console.log(msg);
}

//call the main script entry point
main(OPTIMIST.argv);






