
import os
import traceback

from fastapi import FastAPI, Header, HTTPException, Request
from llama_cpp import Llama
from mangum import Mangum

MODELPATH = "/opt/modelfile.bin"
stage = os.environ.get('STAGE', None)
openapi_prefix = f"/{stage}" if stage else "/"
app = FastAPI(title="OpenLLaMa on Lambda API",
              openapi_prefix=openapi_prefix)  # Here is the magic

llm = Llama(model_path=MODELPATH)


@app.get("/prompt")
async def prompt(
    cuisine: str,
    request: Request,
    tokencount: int = 50,
    penalty: float = 1.1,
):
    # Check if the headers are present, you can do something with this if you'd like to send headers to your function, otherwise ignore
    requestdict = {}
    for header, value in request.headers.items():
        requestdict[header] = value
    returndict = {}

    try:
        # " Below is an instruction that describes a task, as well as any previous text you have generated. You must continue where you left off if there is text following Previous Output. Write a response that appropriately completes the request. When you are finished, write [[COMPLETE]].\n\n Instruction: "+text+" Previous output: "+prioroutput+" Response:", repeat_penalty=penalty, echo=False, max_tokens=tokencount)
        output = llm(
            "Below is an instruction that describes a task, as well as any previous text you have generated. You must continue where you left off if there is text following Previous Output. Write a response that appropriately completes the request. When you are finished, write [[COMPLETE]].\n\n Instruction: I want to open a restaurant for "+cuisine+" food. Suggest a fancy name for this. Response:", repeat_penalty=penalty, echo=False, max_tokens=tokencount)
        returndict['returnmsg'] = output['choices'][0]['text']

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")

    return returndict


handler = Mangum(app)
