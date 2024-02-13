import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export async function handler(event:APIGatewayProxyEvent, context:Context, callback: any): Promise<APIGatewayProxyResult>{

    const lambdaRequestId = context.awsRequestId
    const apiRequestId = event.requestContext.requestId
    console.log(`API Gateway ReqeustId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)
    const { resource, httpMethod } = event

    if(resource === "/products"){
        if(httpMethod === "GET"){
            console.log("GET")
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Hello, World! Lambda"
                })
            }
        }
    }

    return {
        statusCode: 400,
        body: JSON.stringify({
            message: "Bad request."
        })
    }
}