import {
  alphaNormalizeTerm,
  naiveBetaNormalForms,
  isBetaNormal,
  splitNumberSubscript,
  tapply,
  Term,
  termElim,
  tlambda,
  tvar,
  cleanTerm,
} from "./app/utils/term";
import _ from "lodash";

describe("splitNumberSubscript", () => {
  test("split unsplit is identity", () => {
    _.range(0, 1000).forEach(() => {
      const w = _.sampleSize("abc0123456789", _.random(0, 10)).join("");
      expect(splitNumberSubscript(w).join("")).toEqual(w);
    });
  });
  test("basic example", () => {
    expect(splitNumberSubscript("abc123")).toEqual(["abc", "123"]);
  });
  test("empty string", () => {
    expect(splitNumberSubscript("")).toEqual(["", ""]);
  });
  test("no subscript", () => {
    expect(splitNumberSubscript("abc")).toEqual(["abc", ""]);
  });
  test("only number", () => {
    expect(splitNumberSubscript("123")).toEqual(["1", "23"]);
  });
  test("subscript zero", () => {
    expect(splitNumberSubscript("abc0")).toEqual(["abc", "0"]);
  });
  test("with zero and number", () => {
    expect(splitNumberSubscript("abc0123")).toEqual(["abc0", "123"]);
  });
  test("with zero and no number", () => {
    expect(splitNumberSubscript("abc0def")).toEqual(["abc0def", ""]);
  });
  test("multiple zeros", () => {
    expect(splitNumberSubscript("abc000123")).toEqual(["abc000", "123"]);
  });
  test("just zeros", () => {
    expect(splitNumberSubscript("000")).toEqual(["00", "0"]);
  });
  test("just zeros and number", () => {
    expect(splitNumberSubscript("000123")).toEqual(["000", "123"]);
  });
  test("just zero", () => {
    expect(splitNumberSubscript("0")).toEqual(["0", ""]);
  });
  test("number with zero subscript", () => {
    expect(splitNumberSubscript("1230")).toEqual(["1", "230"]);
  });
});

const randomTerm = (maxSize: number): Term => {
  if (maxSize < 0) throw new Error("maxSize must be non-negative");
  if (maxSize === 0) {
    return tvar(_.sample("abc")!);
  }
  const splitLeft = _.random(0, maxSize - 1);
  return _.sample([
    () => tvar(_.sample("abc")!),
    () => tapply(randomTerm(splitLeft), randomTerm(maxSize - 1 - splitLeft)),
    () => tlambda(_.sample("abc")!, randomTerm(maxSize - 1)),
  ])!();
};

const termSize = (t: Term): number =>
  termElim(
    t,
    (t) => 0,
    (t) => 1 + termSize(t.body),
    (t) => 1 + termSize(t.func) + termSize(t.arg),
  );

const numTestTerms = 1000;
const maxTermSize = 15;

const alpha = tapply(tlambda("y'", tlambda("y", tvar("y'"))), tvar("y"));
const alphaClosed = tlambda("y", alpha);
const alphaBug = tapply(tapply(alphaClosed, tvar("a")), tvar("b"));
const testTerms = _.range(numTestTerms).map(() => randomTerm(maxTermSize));
testTerms.push(alphaBug);

test("generated terms are small", () => {
  testTerms.forEach((t) => {
    expect(termSize(t)).toBeLessThanOrEqual(maxTermSize);
  });
});

test("xD", () => {
  console.log(
    "beta normal %:",
    testTerms.map(isBetaNormal).filter((x) => x).length / numTestTerms,
  );
});

test("beta normal is unique", () => {
  testTerms.forEach((t) => {
    const normalForms = naiveBetaNormalForms(t, 5)
      .map((nf) => alphaNormalizeTerm(nf))
      .map(cleanTerm);
    if (normalForms.length > 1) {
      normalForms.forEach((nf) =>
        expect(JSON.stringify(nf)).toBe(JSON.stringify(normalForms[0])),
      );
    }
  });
});
