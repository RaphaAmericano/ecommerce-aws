#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack'
import { EcommerceApiStack } from '../lib/ecommerceApi-stack'

const app = new cdk.App();

const env: cdk.Environment = {
  account:process.env.AWS_ACCOUNT_ID as string,
  region: process.env.AWS_REGION as string
}

const tags = {
  cost: "ECommerce",
  team: "RaphaelAmericano"
}

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  tags: tags,
  env: env
})

const eCommerceApiStack = new EcommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler
})

eCommerceApiStack.addDependency(productsAppStack)

