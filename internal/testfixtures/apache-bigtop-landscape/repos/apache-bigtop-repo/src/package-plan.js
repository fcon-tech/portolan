import { hdfsEndpoint } from '../../apache-hadoop/src/hdfs.js';

export function packagingPlan(clusterName) {
  return {
    foundation: hdfsEndpoint(clusterName),
    artifacts: ['hadoop', 'yarn', 'smoke-tests'],
  };
}
