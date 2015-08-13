(function(mod) {
    var alertService = function($http) {
        return {
            getAlerts: function(cluster) {
                if (cluster !== "undefined") {
                    return $http({
                        method: 'GET',
                        url: '/ovirt-engine/api/events?search=' + encodeURIComponent('severity=alert and cluster=' + cluster.name)
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
                    url: '/ovirt-engine/api/events?search=severity%3Dalert'
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
                    url: '/ovirt-engine/api/events/' + alertId
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
                        url: '/ovirt-engine/api/clusters/?search=' + encodeURIComponent('name=' + cluster.name)
                    }).
                    then(function(response) {
                        return response.data.cluster;
                    });
                }
                return $http({
                    method: 'GET',
                    url: '/ovirt-engine/api/clusters'
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
                        url: '/ovirt-engine/api/hosts/?search=' + encodeURIComponent('cluster=' + cluster.name)
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
                    url: '/ovirt-engine/api/hosts'
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
                    url: '/ovirt-engine/api/hosts/' + hostId + '/statistics'
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
            },
            getNics: function(hostId, hostName) {
                return $http({
                    method: 'GET',
                    url: '/ovirt-engine/api/hosts/' + hostId + '/nics'
                }).
                then(function(response) {
                    if (typeof response.data.host_nic !== 'undefined') {
                        var hostNicInfo = [];
                        hostNicInfo["host_name"] = hostName;
                        hostNicInfo["nic"] = response.data.host_nic;
                        return hostNicInfo;
                    } else {
                        return [];
                    }
                });
            },
            getNicStats: function(hostId, nicId, ip) {
                return $http({
                    method: 'GET',
                    url: '/ovirt-engine/api/hosts/' + hostId + '/nics/' + nicId + '/statistics'
                }).
                then(function(response) {
                    if (typeof response.data.statistic !== 'undefined') {
                        var nicStat = [];
                        nicStat["ip"] = ip;
                        nicStat["statistic"] = response.data.statistic;
                        return nicStat;
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
                var volumesUrl = '/ovirt-engine/api/clusters/' + clusterId + '/glustervolumes';
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
                var statistics = '/ovirt-engine/api/clusters/' + clusterId + '/glustervolumes/' + volumeId + '/statistics';
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
            getBricks: function(clusterId, volumeId, volumeName, replica_count, redundancy_count, disperse_count) {
                var bricksUrl = '/ovirt-engine/api/clusters/' + clusterId + '/glustervolumes/' + volumeId + '/bricks';
                return $http({
                    method: 'GET',
                    url: bricksUrl
                }).
                then(function(response) {
                    if (typeof response.data.brick !== 'undefined') {
                        var bricksInfo = [];
                        bricksInfo["replica_count"] = replica_count;
                        bricksInfo["redundancy_count"] = redundancy_count;
                        bricksInfo["disperse_count"] = disperse_count;
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
                var sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
                var posttxt = 0;
                if (bytes < 1024) {
                    return Number(bytes) + " " + sizes[posttxt];
                }
                while (bytes >= 1024 && posttxt < (sizes.length - 1)) {
                    posttxt++;
                    bytes = bytes / 1024;
                }
                return bytes.toFixed(2) + " " + sizes[posttxt];
            }
        }
    }
    mod.factory('UtilService', [utilService]);
    mod.factory('sessionManager', ['$window', function($window) {
        var sessionId;
        return {
            init: function(session) {
                sessionId = session;
            },
            getSessionId: function() {
                return sessionId;
            },
            exposeSession: function() {
                var caller = this;
                $window.setSessionId = function(sessionId) {
                    caller.init(sessionId);
                };
            }
        };
    }]);
    mod.config(function($httpProvider) {
        $httpProvider.defaults.headers.common = {
            'Accept': 'application/json',
            'Prefer': 'persistent-auth'
        };
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.interceptors.push(function(sessionManager) {
            return {
                'request': function(config) {
                    config.headers.JSESSIONID = sessionManager.getSessionId();
                    return config;
                }
            };
        });
    });

}(angular.module('plugin.dashboard.services', [])));
