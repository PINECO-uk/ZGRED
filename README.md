## Description

Ai agent to help Non profit organization to create:

* refereneces
* certificates
* internship documents

## Components

There are 3  main components in this application:

* Input - is a command space and source of information for the ai agent to start the tasks in the MCP server
* MCP server - is registry  of the tasks, tasks  are defined by prompts and performed by the chosen LLM assistant,
* Output - is result of the work made in the MCP server generated in the json format and joined with templates of the pdf. The finished product is a **pdf file with the content created by the MCP server actions.**

### input

The command space in the form of the chat assistant. User enters the text data (prompt) into the window with the following information:

* "task" - what route should use in the MCP
* "name" and "surname" to find a record and information in the Excel Sheet that will be connected with the application
* "role" - role name to find in the Excel sheet
* "additional info" is a source of the information of the LLM to parse together with the data from the Excel sheet to generate the output

User need to choose one of the defined **tasks** and submit the data for the prompt that meets all of the above conditions. In case some of the data is missing, the prompt should tell the user to add the missing data before submitting the job to MCP server.

The input prompt should generate a valid json object with  following schema

```{json}
{
	"task": "name of the task",
	"name": "",
	"surname": "",
	"role": "",
	"additionalInfo": ""
}
```

This JSON object should be used by the MCP server based on the value in `task` key should decide which tool it should use. All other keys should be passed as input to the tool.

### MCP server

The registry of the tasks that can be performed by the application. This application has 3 defined tasks:

* "references"
* "cert"
* "internship"

The MCP server should accept a JSON object with

```{json}

{
	"task": "name of the task",
	"name": "",
	"surname": "",
	"role": "",
	"additionalInfo": ""
}
```
following schema as input and based on the `task` value choose correct task to run.

#### references task

1. ai assistant takes information "surname " and "name " and searches the Excel Sheet  to find the right record and extract those information for the output:

   * "start date"
   * "end date" - if the cell is empty - puts the information "do dnia dzisiejszego"
   * "team"
   * "main tasks"
  
2. ai assistant takes the information form the "additional info" key and sends it to the LLM Ollama model to parse it according to  the sign in prompt

	```{text}
	Prompt : be a professional leader and based on the given information give a summary of tasks and project that person was involved in, engagement in the on-boarding process, achievements  and main characteristics that describe he/she as a collaborator
	```

	Prompt should output a valid json file with

	```{json}
	{
		name
		surname
		start date
		end date
		team
		main tasks
		main project that person was involved in, 
		engagement in the on-boarding process,
		achievements 
		main characteristics that describe he/she as a collaborator
	}
	```

	Fields `engagement`, `main project `, `achievements` and `main characteristics` have to be derived by the prompt from the input `additional info`field.

#### cert task

1. ai assistant takes information "surname " and "name " and searches the Excel Sheet  to find the right record and extract those information for the output:

   * "start date"
   * "end date" - if the cell is empty - puts the information "do dnia dzisiejszego"
   * "team"
   * "main tasks"
2. ai assistant takes the information form the "additional info" key and sends it to the LLM Ollama model to parse it according to  the sign in prompt

	Prompt : be a professional leader and based on the given information give a summary of tasks engagement in the on-boarding process

	Prompt should output a valid json file with 
	```{json}
	{
		name
		surname
		start date
		end date
		team
		main tasks
		main project that person was involved in, 
		engagement in the on-boarding process,
	}
	```
	
	Fields `engagement`, `main project ` have to be derived by the prompt from the input `additional info`field.

#### internship task

1. ai assistant takes information "surname " and "name " and searches the Excel Sheet  to find the right record and extract those information for the output:
	* "start date"
	* "end date"
	* "team"
	* "main tasks"
2. ai assistant takes the information form the "additional info" key and sends it to the LLM Ollama model to parse it according to  the sign in prompt

	Prompt : be a professional leader and internship supervisor based on the given information give a summary of tasks and project that person was involved in, engagement in the on-boarding process, achievements  and main characteristics that describe he/she as a collaborator, compare the information with the added list of the requirements from the university and also give a grade of the whole internship
	
	Prompt should output a valid json file with 
	```
	{
		name
		surname
		start date
		end date
		team
		main tasks
		main project that person was involved in, 
		engagement in the on-boarding process,
		achievements 
		main characteristics that describe he/she as a collaborator
		comparison of the requirements 
		grade
	}
	```
	
	Fields `engagement`, `main project `, `achievements` and `main characteristics`, `comparison`, `grade` have to be derived by the prompt from the input `additional info`field.

### Output

Output should be a valid pdf file, that is generated based on the template PDF chosen based on the `task` run by the MCP server. The PDF template should be provided from the configuration for every task in the MCP server and they should contain the placeholders for the keys passed by the MCP server tool output JSON blob.

The output should replace the placeholders in PDF template with the actual data from JSON blob and render the document in the path provided by the configuration.

The INPUT agent should be able to show the generated file as an icon to download in the chat.

### Technology

* python
* Local model with Ollama
* uv
* python tools for building MCP server
* pydantic
* loguru (logging)
* testing with pytest

## Example data
The input prompt is " create a cert for anna kowalska volunteer. Additional info : she is active team member. did all of the onboarding process. she did XXX campaing and is a main coordinator of Instagram""
The json file for this data will look like this
{
		name Anna
		surname Kowalska
		start date 1.01.2021 (from the Excel file)
		end date 3.06.2022 (from the Excel file)
		team Marketing Masters (from the Excel file)
		main tasks coordination of Instagram page, preparing content, doing graphics (from the Excel file)
		main project that person was involved in, XXX campaing, main coordinator (from additional info)
		engagement in the on-boarding process, active,(from additional info)
	}gvv
this file goes or the MCP server and send it through the cert process.
yhd mmmmmcmmmmmg

## Prompts
1. Input prompt
2. task prompts

