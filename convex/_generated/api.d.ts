/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates from "../aggregates.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as constants from "../constants.js";
import type * as contract from "../contract.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as matchScouting from "../matchScouting.js";
import type * as pickLists from "../pickLists.js";
import type * as pitScouting from "../pitScouting.js";
import type * as tba from "../tba.js";
import type * as teams from "../teams.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aggregates: typeof aggregates;
  auth: typeof auth;
  authz: typeof authz;
  constants: typeof constants;
  contract: typeof contract;
  events: typeof events;
  http: typeof http;
  matchScouting: typeof matchScouting;
  pickLists: typeof pickLists;
  pitScouting: typeof pitScouting;
  tba: typeof tba;
  teams: typeof teams;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
