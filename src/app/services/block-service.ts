import RpcClient from 'bitcoind-rpc';
import { LevelUp } from 'levelup';
import { integer2LexString } from '../utils/utils';
import { db_block_hash } from './db-constants';

export class BlockService {

  constructor(private db: LevelUp, private rpc: RpcClient) {

  }  

  async saveBlockHash(height: number, hash: string) {
    return this.db.put(db_block_hash+integer2LexString(height), hash);
  }

  async getBlockHash(height: number): Promise<string> {
    return this.db.get(db_block_hash+integer2LexString(height));
  }

  async getRpcBlockHash(height: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.rpc.getBlockHash(height, (err , res) => {
        resolve(res.result);
      });
    });
  }

  async getTipInfo(): Promise<TipInfo> {
    let lastSavedBlock = await this.getLastBlock();
    if (lastSavedBlock === undefined) return undefined;
    let height = lastSavedBlock.height;
    let savedBlockHash = lastSavedBlock.hash;
    let rpcHash = await this.getRpcBlockHash(height);
    while (savedBlockHash !== rpcHash) {
      height--;
      savedBlockHash = await this.getBlockHash(height);
      rpcHash = await this.getRpcBlockHash(height);
    }
    return {lastSavedHeight: lastSavedBlock.height, lastSavedHash: lastSavedBlock.hash, reorgDepth: lastSavedBlock.height-height};
  }

  async getLastBlock(): Promise<{height: number, hash: string}> {
    return new Promise<{height: number, hash: string}>((resolve, reject) => {
      this.db.createReadStream({
        gte:db_block_hash+integer2LexString(0),
        lt:db_block_hash+"z",
        reverse: true,
        limit: 1
      })
      .on('data', function (data) {
        let key: string = data.key;
        let height: number = Number(key.substr(db_block_hash.length));
        resolve({height: height, hash: data.value});
      })
      .on('error', function (err) {
        reject(err);
      })
      .on('close', function () {
        resolve(undefined);
      })
      .on('end', function () {
      });
    });
  }

}  

interface TipInfo {
  lastSavedHeight: number,
  lastSavedHash: string,
  reorgDepth: number
}