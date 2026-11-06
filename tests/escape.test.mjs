import test from "node:test";
import assert from "node:assert/strict";
import { estimatedPerPerson, rankEscapeOptions } from "../lib/escape.ts";

test("nightly estimates account for nights and round up without dropping costs", () => {
  assert.equal(estimatedPerPerson(100000,"daily",2,3),66667);
});
test("a per-stay rate is charged once rather than multiplied by nights", () => {
  assert.equal(estimatedPerPerson(120000,"per_stay",3,4),30000);
});
test("a unanimous match requires at least two participants and a yes from every participant", () => {
  const ranked = rankEscapeOptions([
    {id:"a",votes:[{value:2},{value:2}]}, {id:"b",votes:[{value:2},{value:1}]},
  ],2);
  assert.equal(ranked[0].id,"a"); assert.equal(ranked[0].unanimous,true); assert.equal(ranked[1].unanimous,false);
  assert.equal(rankEscapeOptions([{id:"a",votes:[{value:2}]}],1)[0].unanimous,false);
  assert.equal(rankEscapeOptions([{id:"a",votes:[{value:2}]}],2)[0].unanimous,false);
});
test("all skips produce no suggested winner", () => {
  assert.deepEqual(rankEscapeOptions([{id:"a",votes:[{value:0},{value:0}]}],2),[]);
});
test("closest matches score yes=2 and maybe=1 with deterministic tie-breaking", () => {
  const ranked = rankEscapeOptions([
    {id:"c",votes:[{value:1},{value:1}]}, {id:"b",votes:[{value:2},{value:0}]}, {id:"a",votes:[{value:2},{value:0}]},
  ],2);
  assert.deepEqual(ranked.map(r=>r.id),["a","b","c"]);
  assert.ok(ranked.every(r=>!r.unanimous));
});

test("monthly and yearly rates cannot be treated as daily Escape Match rates", () => {
  assert.throws(() => estimatedPerPerson(500000,"monthly",2,4),RangeError);
  assert.throws(() => estimatedPerPerson(500000,"yearly",2,4),RangeError);
});
