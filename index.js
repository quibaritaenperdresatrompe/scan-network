import arp from "node-arp";
import dns from "dns";
import ip from "ip";
import ping from "ping";
import util from "util";

const macRegEx = /^((([a-fA-F0-9][a-fA-F0-9]+[-]){5}|([a-fA-F0-9][a-fA-F0-9]+[:]){5})([a-fA-F0-9][a-fA-F0-9])$)|(^([a-fA-F0-9][a-fA-F0-9][a-fA-F0-9][a-fA-F0-9]+[.]){2}([a-fA-F0-9][a-fA-F0-9][a-fA-F0-9][a-fA-F0-9]))$/;
const base = ip.address().split(".").slice(0, -1);
const devices = await Array.from({ length: 255 }, (_, k) =>
  [...base, k + 1].join(".")
)
  .filter(async (ip) => await ping.promise.probe(ip).alive)
  .reduce(async (acc, ip) => {
    let device;
    try {
      const [hostname] = await util.promisify(dns.reverse)(ip);
      const mac = await util.promisify(arp.getMAC)(ip);
      if (hostname && mac?.match(macRegEx)) {
        device = { hostname, mac };
      }
    } catch (error) {
      if (!["ENOTFOUND"].includes(error.code)) {
        console.error(error);
      }
    }
    return [...(await acc), device].filter(Boolean);
  }, []);

console.table(devices);
