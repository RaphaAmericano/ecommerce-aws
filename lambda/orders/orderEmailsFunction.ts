import { Context, SNSMessage, SQSEvent } from "aws-lambda"
import * as AWSXRay from "aws-xray-sdk"
import { Envelope, OrderEvent } from "./layers/orderEventsLayer/nodejs/orderEvent"
import { AWSError, SES }from "aws-sdk"
import { PromiseResult } from "aws-sdk/lib/request"

AWSXRay.captureAWS(require("aws-sdk"))

const sesClient = new SES()

export async function handler(event:SQSEvent, context: Context): Promise<void>{
    
    // info: to test DLQ
    // console.log('Non valid event type')
    // throw 'Non valid event type'
    const promises:Promise<PromiseResult<SES.SendEmailResponse, AWSError>>[] = []
    event.Records.forEach((record) => {
        const body = JSON.parse(record.body) as SNSMessage
        promises.push(sendOrderEmail(body))
    })
    await Promise.all(promises)
    
    return
}

function sendOrderEmail(body: SNSMessage){
    const envelope = JSON.parse(body.Message) as Envelope
    const event = JSON.parse(envelope.data) as OrderEvent

    return sesClient.sendEmail({
        Destination: {
            ToAddresses: [event.email],
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: `Recebemos seu pedido de número ${event.orderId}, no valor de R$ ${event.billing.totalPrice}`
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Recebemos seu pedido!"
            }
        },
        Source: "raphael@raphaelamericano.com.br",
        ReplyToAddresses: ["raphael@raphaelamericano.com.br"]
    }).promise()
}
