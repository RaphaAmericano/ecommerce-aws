import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as sns from "aws-cdk-lib/aws-sns"
import * as subs from "aws-cdk-lib/aws-sns-subscriptions"
import { Construct } from "constructs"

interface OrdersAppStackProps extends cdk.StackProps {
    productsDdb: dynamodb.Table,
    eventsDdb: dynamodb.Table
}

export class OrdersAppStack extends cdk.Stack {
    public readonly ordersHandler: lambdaNodeJS.NodejsFunction
    constructor(scope: Construct, id: string, props: OrdersAppStackProps ){
        super(scope, id, props)

        const ordersDdb = new dynamodb.Table(this, "OrdersDdb", {
            tableName: "orders",
            partitionKey: {
                name:"pk",
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: "sk",
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PROVISIONED,
            readCapacity: 1,
            writeCapacity: 1
        })

        // Orders Layer
        const ordersLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrdersLayerVersionArn")
        const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersLayerVersionArn", ordersLayerArn)

        // Orders API Layer
        const ordersApiLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrdersLayerApiVersionArn")
        const ordersApiLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersApiLayerVersionArn", ordersApiLayerArn)

        // Orders Events Layer
        const ordersEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, "OrderLayerEventsVersionArn")
        const ordersEventsLyer = lambda.LayerVersion.fromLayerVersionArn(this, "OrderEventsLayerVersionArn", ordersEventsLayerArn)

        // Products Layer 
        // ? Products Layer
        const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayerVersionArn")
        const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayerVersionArn", productsLayerArn)

        const ordersTopic = new sns.Topic(this, "OrderEventsTopic", {
            displayName:"Order events topic",
            topicName: "order-events"
        })


        this.ordersHandler = new lambdaNodeJS.NodejsFunction(this, "OrdersFunction", {
            runtime: lambda.Runtime.NODEJS_20_X,
            functionName: "OrdersFunction",
            entry: "lambda/orders/ordersFunction.ts",
            handler: "handler",
            memorySize: 512,
            timeout: cdk.Duration.seconds(5),
            bundling:{
                minify: true, 
                sourceMap: false
            },
            environment:{
                PRODUCTS_DDB: props.productsDdb.tableName,
                ORDERS_DDB: ordersDdb.tableName,
                ORDER_EVENTS_TOPIC_ARN: ordersTopic.topicArn
            },
            layers: [ordersLayer, productsLayer, ordersApiLayer, ordersEventsLyer],
            tracing: lambda.Tracing.ACTIVE,
            insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
        })

        ordersDdb.grantReadWriteData(this.ordersHandler)
        props.productsDdb.grantReadData(this.ordersHandler)
        ordersTopic.grantPublish(this.ordersHandler)

        const orderEventsHandler = new lambdaNodeJS.NodejsFunction(this, "OrderEventsFunction", {
            runtime: lambda.Runtime.NODEJS_20_X,
            functionName: "OrderEventsFunction",
            entry: "lambda/orders/orderEventsFunction.ts",
            handler: "handler",
            memorySize: 512,
            timeout: cdk.Duration.seconds(5),
            bundling:{
                minify: true, 
                sourceMap: false
            },
            environment:{
                EVENTS_DDB: props.eventsDdb.tableName
            },
            layers: [ordersEventsLyer],
            tracing: lambda.Tracing.ACTIVE,
            insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0
        }) 

        ordersTopic.addSubscription(new subs.LambdaSubscription(orderEventsHandler))

    }
}
