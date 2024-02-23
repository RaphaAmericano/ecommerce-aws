import { Context, SQSEvent } from "aws-lambda"
import * as AWSXRay from "aws-xray-sdk"

AWSXRay.captureAWS(require("aws-sdk"))

export async function handler(event:SQSEvent, context: Context): Promise<void>{
    
    // info: to test DLQ
    // console.log('Non valid event type')
    // throw 'Non valid event type'
    
    event.Records.forEach((record) => {
        console.log(record)
        const body = JSON.parse(record.body)
        console.log(body)
    })


    return
}
