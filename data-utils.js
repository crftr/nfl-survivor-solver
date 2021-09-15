import util from "util";

const deepLog = (myObject) => {
  console.log(
    util.inspect(myObject, { showHidden: false, depth: null, colors: true })
  );
};

export { deepLog };