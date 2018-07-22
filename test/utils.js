export const getTotalGasUsage = tx => {
  console.log(
    "TOTAL GAS USAGE : ",
    tx.reduce((acc, next) => {
      acc += next.receipt
        ? Number(next.receipt.cumulativeGasUsed)
        : Number(next);
      return acc;
    }, 0)
  );
};
