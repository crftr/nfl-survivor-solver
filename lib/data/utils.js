import util from "util";
import v8 from "v8";

function* combinationGenerator(dataArrayOfArrays) {
  const currentArray = dataArrayOfArrays[0];
  const remainderArray = dataArrayOfArrays.slice(1);
  const hasRemainder = remainderArray.length > 0;

  for (let current of currentArray) {
    if (hasRemainder) {
      for (let remainder of combinationGenerator(remainderArray)) {
        yield [current, remainder].flat();
      }
    } else {
      yield [current];
    }
  }
}

const deepLog = (myObject) => {
  console.log(
    util.inspect(myObject, { showHidden: false, depth: null, colors: true })
  );
};

const structuredClone = (obj) => {
  return v8.deserialize(v8.serialize(obj));
};

export { combinationGenerator, deepLog, structuredClone };
