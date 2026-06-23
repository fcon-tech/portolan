export function hdfsEndpoint(clusterName) {
  return `hdfs://${clusterName}`;
}

export function yarnQueue(owner) {
  return `root.${owner}`;
}
