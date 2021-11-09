const Papa = require("papaparse");
const fs = require("fs");

const file = fs.createReadStream("files/audit.csv");
const md5File = fs.createReadStream("files/md5sum.csv");
const sectorFile = fs.createReadStream("files/htm.csv");

const final = [];

Papa.parse(file, {
  header: true,
  complete: ({ data: res }) => {
    const data = res.map((row) => {
      return Object.assign(
        {},
        ...Object.keys(row).map((element) => ({
          [element]: row[element].trim(),
        }))
      );
    });
    Papa.parse(sectorFile, {
      header: true,
      complete: async ({ data: sectorRes }) => {
        Papa.parse(md5File, {
          header: true,
          step: async ({ data: md5Res }) => {
            const auditRes = data.find(
              (a) => a.name == md5Res.file.trim().slice(6)
            );
            const size = auditRes?.size?.split(" ");
            const finalRes = {
              ...auditRes,
              md5: md5Res.md5.trim(),
              sector: `${auditRes?.fileOffset.trim()} - ${
                parseInt(auditRes?.fileOffset.trim()) +
                parseInt(
                  sectorRes
                    .find((c) => c?.file?.trim() == auditRes?.name)
                    ?.size?.trim()
                ) -
                1
              }`,
              size:
                parseInt(size?.[0]) *
                (size?.[1] === "MB"
                  ? 1024 * 1024
                  : size?.[1] === "KB"
                  ? 1024
                  : 1),
            };

            final.push(finalRes);
          },
          complete: async () => {
            console.log(Papa.unparse(final.slice(1)));
          },
        });
      },
    });
  },
});
