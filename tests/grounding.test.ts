import { describe, it, expect } from 'vitest';
import { findUngrounded } from '../lib/grounding';

describe('Grounding Checker', () => {
  const bankFacts = "Call 0800 555 0199. Overdraft is 6 pounds or £6. Open 09:30 to 16:30.";

  it('passes safely when no numbers are in the reply', () => {
    const result = findUngrounded("How can I help you today?", bankFacts);
    expect(result).toEqual([]);
  });

  it('allows a real phone number even if spacing is different', () => {
    const result = findUngrounded("Call us on 08005550199.", bankFacts);
    expect(result).toEqual([]);
  });

  it('catches an invented phone number', () => {
    const result = findUngrounded("Call us on 0800 999 9999.", bankFacts);
    expect(result).toEqual([{ kind: "phone", value: "0800 999 9999" }]);
  });

  it('allows £6 because 6 pounds is in the fact sheet', () => {
    const result = findUngrounded("The fee is £6.", bankFacts);
    expect(result).toEqual([]);
  });

  it('catches an invented money amount', () => {
    const result = findUngrounded("The fee is 10 pounds.", bankFacts);
    expect(result).toEqual([{ kind: "money", value: "10 pounds" }]);
  });

  it('allows a real time', () => {
    const result = findUngrounded("We open at 09:30.", bankFacts);
    expect(result).toEqual([]);
  });

  it('catches an invented time', () => {
    const result = findUngrounded("We close at 18:00.", bankFacts);
    expect(result).toEqual([{ kind: "time", value: "18:00" }]);
  });
});
