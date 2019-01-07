import * as lexi from 'lexint';
import { db_balace_to_cluster_prefix } from "../services/db-constants";
import { PrefixTable } from './prefix-table';

export class BalanceToClusterTable extends PrefixTable< { balance: number, clusterId?: number}, 
{  }> {

  prefix = db_balace_to_cluster_prefix;
  keyencoding = {
    encode: (key: { balance: number, clusterId: number}): Buffer => {
      //console.log("encoding ", key);
      if (key.clusterId === undefined) 
        return Buffer.from(lexi.encode(key.balance));
      else
        return Buffer.concat([Buffer.from(lexi.encode(key.balance)), lexi.encode(key.clusterId)]);
    },
    decode: (buf: Buffer): { balance: number, clusterId: number} => {
      let balance = lexi.decode(buf, 0);
      let clusterId = lexi.decode(buf, balance.byteLength);
      return {
        balance: balance.value,
        clusterId: clusterId.value
      };
    }
  };

  valueencoding = {
    encode: (key: { }): Buffer => {
      return Buffer.alloc(0);
    },
    decode: (buf: Buffer): {  } => {
      return {};
    }
  };

}  