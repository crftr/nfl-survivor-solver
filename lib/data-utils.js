import util from "util";
import v8 from "v8";

const deepLog = (myObject) => {
  console.log(
    util.inspect(myObject, { showHidden: false, depth: null, colors: true })
  );
};

const structuredClone = obj => {
  return v8.deserialize(v8.serialize(obj));
};

export { deepLog, structuredClone };
