(function(mod) {
    var alertService = function($http) {
        return {
            getAlerts: function(cluster) {
                if (cluster !== "undefined") {
                    return $http({
                        method: 'GET',
                        url: '/api/events?search=' + encodeURIComponent('severity=alert and cluster=' + cluster.name)
                    }).
                    then(function(response) {
                        if (typeof response.data.event !== 'undefined') {
                            return response.data.event;
                        } else {
                            return [];
                        }
                    });
                }
                return $http({
                    method: 'GET',
                    url: '/api/events?search=severity%3Dalert'
                }).
                then(function(response) {
                    if (typeof response.data.event !== 'undefined') {
                        return response.data.event;
                    } else {
                        return [];
                    }
                });
            },
            deleteAlert: function(alertId) {
                return $http({
                    method: 'DELETE',
                    url: '/api/events/' + alertId
                });
            }
        }
    }
    mod.factory('AlertService', ['$http', alertService]);
    var clusterService = function($http) {
        return {
            getClusters: function(cluster) {
                if (cluster !== "undefined") {
                    return $http({
                        method: 'GET',
                        url: '/api/clusters/?search=' + encodeURIComponent('name=' + cluster.name)
                    }).
                    then(function(response) {
                        return response.data.cluster;
                    });
                }
                return $http({
                    method: 'GET',
                    url: '/api/clusters'
                }).
                then(function(response) {
                    return response.data.cluster;
                });
            },
        }
    }
    mod.factory('ClusterService', ['$http', clusterService]);
    var hostService = function($http) {
        return {
            getHosts: function(cluster) {
                if (cluster !== "undefined") {
                    return $http({
                        method: 'GET',
                        url: '/api/hosts/?search=' + encodeURIComponent('cluster=' + cluster.name)
                    }).
                    then(function(response) {
                        if (typeof response.data.host !== 'undefined') {
                            return response.data.host;
                        } else {
                            return [];
                        }
                    });
                }
                return $http({
                    method: 'GET',
                    url: '/api/hosts'
                }).
                then(function(response) {
                    if (typeof response.data.host !== 'undefined') {
                        return response.data.host;
                    } else {
                        return [];
                    }
                });
            },
            getHostStatistics: function(hostId, hostName) {
                return $http({
                    method: 'GET',
                    url: '/api/hosts/' + hostId + '/statistics'
                }).
                then(function(response) {
                    if (typeof response.data.statistic !== 'undefined') {
                        var hostInfo = [];
                        hostInfo["name"] = hostName;
                        hostInfo["statistic"] = response.data.statistic;
                        return hostInfo;
                    } else {
                        return [];
                    }
                });
            }
        }
    }
    mod.factory('HostService', ['$http', hostService]);
    var volumeService = function($http) {
        return {
            getVolumes: function(clusterId) {
                var volumesUrl = '/api/clusters/' + clusterId + '/glustervolumes';
                return $http({
                    method: 'GET',
                    url: volumesUrl
                }).
                then(function(response) {
                    if (typeof response.data.gluster_volume !== 'undefined') {
                        return response.data.gluster_volume;
                    } else {
                        return [];
                    }
                });
            },
            getVolumeStatistics: function(clusterId, volumeId, volumeName) {
                var statistics = '/api/clusters/' + clusterId + '/glustervolumes/' + volumeId + '/statistics';
                return $http({
                    method: 'GET',
                    url: statistics
                }).
                then(function(response) {
                    if (typeof response.data.statistic !== 'undefined') {
                        var volumeStat = [];
                        volumeStat["statistic"] = response.data.statistic;
                        volumeStat["name"] = volumeName;
                        return volumeStat;
                    } else {
                        return [];
                    }
                });
            },
            getBricks: function(clusterId, volumeId, volumeName, replica_count) {
                var bricksUrl = '/api/clusters/' + clusterId + '/glustervolumes/' + volumeId + '/bricks';
                return $http({
                    method: 'GET',
                    url: bricksUrl
                }).
                then(function(response) {
                    if (typeof response.data.brick !== 'undefined') {
                        var bricksInfo = [];
                        bricksInfo["replica_count"] = replica_count;
                        bricksInfo["bricks"] = response.data.brick;
                        bricksInfo["cluster_id"] = clusterId;
                        bricksInfo["volume_name"] = volumeName;
                        return bricksInfo;
                    } else {
                        return [];
                    }
                });
            }
        }
    }
    mod.factory('VolumeService', ['$http', volumeService]);
    var utilService = function() {
        return {
            convertSize: function(bytes) {
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                var posttxt = 0;
                if (bytes == 0) return 'n/a';
                if (bytes < 1024) {
                    return Number(bytes) + " " + sizes[posttxt];
                }
                while (bytes >= 1024) {
                    posttxt++;
                    bytes = bytes / 1024;
                }
                return bytes.toFixed(2) + " " + sizes[posttxt];
            }
        }
    }
    mod.factory('UtilService', [utilService]);
}(
    angular.module('plugin.dashboard.services', [])
));