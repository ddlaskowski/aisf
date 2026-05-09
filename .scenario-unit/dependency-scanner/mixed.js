import localDefault from "./esm-default";
import { thing } from "../utils/thing";
import * as allTools from "./tools";
import "./setup";
import express from "express";
const helper = require("./helper");
const { math } = require("../math");
require("./setup");
const react = require("react");
module.exports = helper;
exports.foo = math;
module.exports.bar = allTools;
export default helper;
export function greet() {}
export const answer = 42;
export let count = 0;
export var legacy = true;
export class Widget {}
exports.foo = math;