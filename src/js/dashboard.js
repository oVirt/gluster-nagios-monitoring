(function(mod) {
    var summaryCtrl = function($scope, $interval, $q, clusterService, volumeService, hostService, utilService, alertService) {
        $scope.summary = {
            health_status: "Healthy",
            unhealthy_cluster_list: {},
            unhealthy_volumes: [],
            hosts_up: 0,
            hosts_down_list: [],
            hosts_maintenance_list: [],
            volumes_up: 0,
            volumes_down: 0,
            volumes_stopped: 0,
            volumes_degraded: 0,
            volumes_partial: 0,
            used_space: 0,
            available_space: 0,
            total_space: 0,
            used_space_units: 0,
            available_space_units: 0,
            total_space_units: 0,
            average_cpu_usage: 0,
            average_memory_usage: 0,
            alerts: [],
            cluster_list: [],
            selected_cluster: "undefined",
            cpu_usage_list: [],
            max_cpu: 0,
            memory_usage_list: [],
            max_memory: 0,
            volume_usage_percent: [],
            max_vol_usage: 0,
            all_volumes: [],
            volume_Stat_Update_Flag: 0,
            nic_up: 0,
            nic_down_list: [],
            average_data_received: 0,
            average_data_transmitted: 0,
            data_received_list: [],
            data_transmitted_list: []
        };
        $interval(function() {
            loadData($scope, $q, clusterService, volumeService, hostService, utilService, alertService);
        }, 10000, false);
        $interval(function() {
            VolumeStatRefresh($scope, $q, volumeService, utilService);
        }, 60000, false);
        loadData($scope, $q, clusterService, volumeService, hostService, utilService, alertService);
        VolumeStatRefresh($scope, $q, volumeService, utilService);
        $scope.switchCluster = function(cluster) {
            if (cluster === 'undefined') {
                $scope.summary.selected_cluster = "undefined";
            } else {
                $scope.summary.selected_cluster = cluster;
            }
            $scope.summary.volume_Stat_Update_Flag = 0;
            loadData($scope, $q, clusterService, volumeService, hostService, utilService, alertService);
        };
        $scope.deleteAlert = function(alertObj) {
            alertService.deleteAlert(alertObj.id);
            alertService.getAlerts($scope.summary.selected_cluster).
            then(function(data) {
                $scope.summary.alerts = data;
            });
        };
        $scope.tooltip = function() {
            $('.hasTooltip').each(function() {
                $(this).qtip({
                    position: {
                        my: 'bottom center',
                        at: 'top center',
                        target: $(this)
                    },
                    style: {
                        classes: 'qtip-bootstrap'
                    },
                    content: {
                        text: $(this).next('div').html(),
                        title: $(this).next('div').attr('title')
                    },
                    hide: {
                        event: false,
                        fixed: true,
                        inactive: 3000
                    }
                });
            });
            $('.hasTooltip-bottom').each(function() {
                $(this).qtip({
                    position: {
                        my: 'top center',
                        at: 'bottom center',
                        target: $(this)
                    },
                    style: {
                        classes: 'qtip-bootstrap'
                    },
                    content: {
                        text: $(this).next('div').html(),
                        title: $(this).next('div').attr('title')
                    },
                    hide: {
                        event: false,
                        fixed: true,
                        inactive: 3000
                    }
                });
            });
            $('.NicTooltip').each(function() {
                $(this).qtip({
                    position: {
                        my: 'bottom center',
                        at: 'top center',
                        target: $(this)
                    },
                    style: {
                        classes: 'qtip-bootstrap'
                    },
                    content: {
                        text: $(this).next('div').html(),
                        title: $(this).next('div').attr('title'),
                        button: true
                    },
                    hide: {
                        event: false,
                        fixed: true,
                    }
                });
            });
        };
    }
    var VolumeStatRefresh = function($scope, $q, volumeService, utilService) {
        var volume_promise = [];
        angular.forEach($scope.summary.all_volumes, function(volume) {
            volume_promise.push(volumeService.getVolumeStatistics(volume.cluster.id, volume.id, volume.name));
        });
        $q.all(volume_promise).
        then(function(volumes_statistics) {
            var vol_usage_list = [];
            var available_space = 0;
            var used_space = 0;
            var total_space = 0;
            angular.forEach(volumes_statistics, function(volume_statistic_obj) {
                var volume_statistics = volume_statistic_obj["statistic"];
                var volume_name = volume_statistic_obj["name"];
                var total_volume_space = 0;
                var total_volume_used = 0;
                var total_volume_available = 0;
                if (volume_statistics.length > 0) {
                    total_volume_available = parseInt(volume_statistics.filter(function(statistics) {
                        return statistics.name === 'memory.free.size';
                    })[0].values.value[0].datum);
                    total_volume_used = parseInt(volume_statistics.filter(function(statistics) {
                        return statistics.name === 'memory.used.size';
                    })[0].values.value[0].datum);
                    total_volume_space = parseInt(volume_statistics.filter(function(statistics) {
                        return statistics.name === 'memory.total.size';
                    })[0].values.value[0].datum);
                    available_space += total_volume_available;
                    used_space += total_volume_used;
                    total_space += total_volume_space;
                    var vol_usage = [];
                    vol_usage["usage"] = Math.round(((total_volume_used / total_volume_space) * 100 * 100) / 100);
                    vol_usage["name"] = volume_name;
                    vol_usage_list.push(vol_usage);
                }
            });
            vol_usage_list.sort(function(a, b) {
                if (a.usage > b.usage) {
                    return -1;
                }
                if (a.usage < b.usage) {
                    return 1;
                }
                return 0;
            });
            $scope.summary.volume_usage_percent = vol_usage_list;
            if (vol_usage_list.length > 0) {
                $scope.summary.max_vol_usage = vol_usage_list[0]["usage"];
            } else {
                $scope.summary.max_vol_usage = 0;
            }
            $scope.summary.available_space = available_space;
            $scope.summary.used_space = used_space;
            $scope.summary.total_space = total_space;
            $scope.summary.available_space_units = utilService.convertSize(available_space);
            $scope.summary.used_space_units = utilService.convertSize(used_space);
            $scope.summary.total_space_units = utilService.convertSize(total_space);
        });
    }
    var loadData = function($scope, $q, clusterService, volumeService, hostService, utilService, alertService) {
        $scope.summary.unhealthy_volumes = [];
        clusterService.getClusters($scope.summary.selected_cluster).
        then(function(clusters) {
            if ($scope.summary.cluster_list.length == 0) {
                $scope.summary.cluster_list = clusters;
            }
            var list = [];
            angular.forEach(clusters, function(cluster) {
                list.push(volumeService.getVolumes(cluster.id));
            });
            return $q.all(list);
        }).
        then(function(volumes_in_cluster) {
            var all_volumes = [];
            var unhealthy_volumes = [];
            var bricks_promise = [];
            angular.forEach(volumes_in_cluster, function(volumes) {
                Array.prototype.push.apply(all_volumes, volumes);
            });
            $scope.summary.all_volumes = all_volumes;
            if ($scope.summary.volume_Stat_Update_Flag == 0) {
                VolumeStatRefresh($scope, $q, volumeService, utilService);
                $scope.summary.volume_Stat_Update_Flag = 1;
            }
            var no_of_volumes = all_volumes.length;
            var volumes_up = 0;
            var volumes_stopped = 0;
            angular.forEach(all_volumes, function(volume) {
                if (volume.status.state === 'down') {
                    unhealthy_volumes.push({
                        name: volume.name,
                        status: "Stopped"
                    });
                    volumes_stopped++;
                } else {
                    volumes_up++;
                    bricks_promise.push(volumeService.getBricks(volume.cluster.id, volume.id, volume.name, volume.replica_count, volume.redundancy_count, volume.disperse_count));
                }
            });
            $scope.summary.volumes_stopped = volumes_stopped;
            $scope.summary.volumes_up = volumes_up;
            $q.all(bricks_promise).then(function(bricks_in_volumes) {
                var health_status = "Healthy";
                var unhealthy_cluster_ids = [];
                var local_count_volumes_partial = 0;
                var local_count_volumes_down = 0;
                var volumes_degraded = 0;
                angular.forEach(bricks_in_volumes, function(bricksInfo) {
                    var volumes_down = 0;
                    var volumes_partial = 0;
                    var replica_count = bricksInfo.replica_count;
                    var disperse_count = bricksInfo.disperse_count;
                    var redundancy_count = bricksInfo.redundancy_count;
                    var volume_name = bricksInfo.volume_name;
                    var bricks = bricksInfo.bricks;
                    var bricks_down = bricks.filter(function(brick) {
                        return brick.status.state === 'down';
                    }).length;
                    if (bricks_down == bricks.length) {
                        volumes_down++;
                        unhealthy_volumes.push({
                            name: volume_name,
                            status: "Down"
                        });
                    }
                    local_count_volumes_down += volumes_down;
                    if (volumes_down == 0) {
                        /* Distributed Disperse */
                        if (disperse_count > 0 && redundancy_count > 0) {
                            var degraded = 0;
                            var partial = 0;
                            for (var i = 0; i < bricks.length / disperse_count; i++) {
                                var downstate = 0;
                                for (var j = 0; j < disperse_count; j++) {
                                    var brick = bricks[(i * disperse_count) + j];
                                    if (brick.status.state === 'down') downstate++;
                                }
                                if (downstate > redundancy_count) {
                                    partial++;
                                } else if (downstate > 0) {
                                    degraded++;
                                }
                            }
                            if (degraded > 0 && partial == 0) {
                                volumes_degraded++;
                                unhealthy_volumes.push({
                                    name: volume_name,
                                    status: "Degraded"
                                });
                            } else if (partial > 0 && partial != bricks.length / disperse_count) {
                                volumes_partial++;
                                unhealthy_volumes.push({
                                    name: volume_name,
                                    status: "Partial"
                                });
                            } else if (partial == bricks.length / disperse_count) {
                                local_count_volumes_down++;
                                unhealthy_volumes.push({
                                    name: volume_name,
                                    status: "Down"
                                });
                            }
                        } else if (replica_count > 1) {
                            var maxset = 0;
                            for (var i = 0; i < bricks.length / replica_count; i++) {
                                var downstate = 0;
                                for (var j = 0; j < replica_count; j++) {
                                    var brick = bricks[(i * replica_count) + j];
                                    if (brick.status.state === 'down') downstate++;
                                }
                                maxset = (maxset < downstate) ? downstate : maxset;
                            }
                            if (maxset > 0)
                                if (maxset == replica_count) {
                                    volumes_partial++;
                                    unhealthy_volumes.push({
                                        name: volume_name,
                                        status: "Partial"
                                    });
                                } else {
                                    volumes_degraded++;
                                    unhealthy_volumes.push({
                                        name: volume_name,
                                        status: "Degraded"
                                    });
                                }
                        } else if ((bricks.length - bricks_down) != bricks.length) {
                            unhealthy_volumes.push({
                                name: volume_name,
                                status: "Partial"
                            });
                            volumes_partial++;
                        }
                    }
                    if (volumes_partial > 0 || volumes_down > 0) {
                        health_status = "Unhealthy";
                        unhealthy_cluster_ids[bricksInfo.cluster_id] = 0;
                    }
                    local_count_volumes_partial += volumes_partial
                });
                $scope.summary.volumes_down = local_count_volumes_down;
                $scope.summary.volumes_partial = local_count_volumes_partial;
                $scope.summary.volumes_degraded = volumes_degraded;
                $scope.summary.health_status = health_status;
                $scope.summary.unhealthy_volumes = unhealthy_volumes;
                var unhealthy_cluster_list = $scope.summary.cluster_list.filter(function(cluster) {
                    for (var i = 0; i < Object.keys(unhealthy_cluster_ids).length; i++) {
                        if (Object.keys(unhealthy_cluster_ids)[i] == cluster.id) {
                            return true;
                        }
                    }
                    return false;
                });
                $scope.summary.unhealthy_cluster_list = unhealthy_cluster_list;
            });
        })
        hostService.getHosts($scope.summary.selected_cluster).
        then(function(hosts) {
            var no_of_hosts = hosts.length;
            var up_hosts = [];
            var hosts_down_list = [];
            var hosts_maintenance_list = [];
            angular.forEach(hosts, function(host) {
                if( host.status.state == 'maintenance'){
                    hosts_maintenance_list.push(host.name);
                }else if( host.status.state == 'up'){
                    up_hosts.push(host);
                }else {
                    hosts_down_list.push(host.name);
                }
            });
            $scope.summary.hosts_down_list = hosts_down_list;
            $scope.summary.hosts_maintenance_list = hosts_maintenance_list;
            $scope.summary.hosts_up = up_hosts.length;
            var host_promises = [];
            var host_nic_promises = [];
            angular.forEach(up_hosts, function(host) {
                host_promises.push(hostService.getHostStatistics(host.id, host.name));
                host_nic_promises.push(hostService.getNics(host.id, host.name));
            });
            $q.all(host_nic_promises).then(function(host_nic) {
                var host_nic_stat_promises = [];
                var nic_up = 0;
                var nic_down_list = [];
                angular.forEach(host_nic, function(host_nic) {
                    var host_name = host_nic.host_name;
                    angular.forEach(host_nic.nic, function(nic) {
                        if(nic.ip.address != ''){
                            if (nic.status.state != 'up') {
                                nic_down_list.push({
                                    host_name: host_name,
                                    state: nic.status.state,
                                    nic_name: nic.name
                                });
                            } else {
                                nic_up++;
                                host_nic_stat_promises.push(hostService.getNicStats(nic.host.id, nic.id, nic.ip));
                            }
                        }
                    });
                });
                $scope.summary.nic_up = nic_up;
                $scope.summary.nic_down_list = nic_down_list;
                return $q.all(host_nic_stat_promises);
            }).then(function(host_nic_stats) {
                var total_data_received = 0;
                var total_data_transmitted = 0;
                var data_received_list = [];
                var data_transmitted_list = [];
                angular.forEach(host_nic_stats, function(host_nic_stats_obj) {
                    var nic_statistics = host_nic_stats_obj["statistic"];
                    var ip = host_nic_stats_obj["ip"];
                    var data_received = 0;
                    var data_transmitted = 0;
                    data_received = parseInt(nic_statistics.filter(function(statistics) {
                        return statistics.name === 'data.current.rx';
                    })[0].values.value[0].datum);
                    data_transmitted = parseInt(nic_statistics.filter(function(statistics) {
                        return statistics.name === 'data.current.tx';
                    })[0].values.value[0].datum);
                    data_received = isNaN(data_received) ? 0 : data_received;
                    data_transmitted = isNaN(data_transmitted) ? 0 : data_transmitted;
                    data_received_list.push({
                        usage: utilService.convertSize(data_received),
                        ip: ip.address
                    });
                    data_transmitted_list.push({
                        usage: utilService.convertSize(data_transmitted),
                        ip: ip.address
                    });
                    total_data_received += data_received;
                    total_data_transmitted += data_transmitted;
                });
                $scope.summary.average_data_received = utilService.convertSize(total_data_received / host_nic_stats.length);
                $scope.summary.average_data_transmitted = utilService.convertSize(total_data_transmitted / host_nic_stats.length);
                $scope.summary.data_received_list = data_received_list;
                $scope.summary.data_transmitted_list = data_transmitted_list;
            });
            return $q.all(host_promises);
        }).then(function(hostStatistics) {
            var total_memory_usage_percent = 0;
            var total_cpu_usage_percent = 0;
            var cpu_usage_list = [];
            var memory_usage_list = [];
            angular.forEach(hostStatistics, function(host_statistics) {
                var statistics = host_statistics["statistic"];
                var total_memory = parseInt(statistics.filter(function(statistic) {
                    return statistic.name === 'memory.total';
                })[0].values.value[0].datum);
                var used_memory = parseInt(statistics.filter(function(statistic) {
                    return statistic.name === 'memory.used';
                })[0].values.value[0].datum);
                total_memory_usage_percent += (used_memory / total_memory) * 100;
                var mem_info = [];
                mem_info["usage"] = Math.round((used_memory / total_memory) * 100 * 100) / 100;
                mem_info["name"] = host_statistics["name"];
                memory_usage_list.push(mem_info);
                var system_cpu_usage = parseInt(statistics.filter(function(statistic) {
                    return statistic.name === 'cpu.current.system';
                })[0].values.value[0].datum);
                var user_cpu_usage = parseInt(statistics.filter(function(statistic) {
                    return statistic.name === 'cpu.current.user';
                })[0].values.value[0].datum);
                total_cpu_usage_percent += system_cpu_usage + user_cpu_usage;
                var cpu_info = [];
                cpu_info["usage"] = system_cpu_usage + user_cpu_usage;
                cpu_info["name"] = host_statistics["name"];
                cpu_usage_list.push(cpu_info);
            });
            cpu_usage_list.sort(function(a, b) {
                if (a.usage > b.usage) {
                    return -1;
                }
                if (a.usage < b.usage) {
                    return 1;
                }
                return 0;
            });
            memory_usage_list.sort(function(a, b) {
                if (a.usage > b.usage) {
                    return -1;
                }
                if (a.usage < b.usage) {
                    return 1;
                }
                return 0;
            });
            $scope.summary.cpu_usage_list = cpu_usage_list;
            $scope.summary.memory_usage_list = memory_usage_list;
            if (cpu_usage_list.length > 0) {
                $scope.summary.max_cpu = cpu_usage_list[0]["usage"];
            } else {
                $scope.summary.max_cpu = 0;
            }
            if (memory_usage_list.length > 0) {
                $scope.summary.max_memory = memory_usage_list[0]["usage"];
            } else {
                $scope.summary.max_memory = 0;
            }
            var average = (total_memory_usage_percent / hostStatistics.length).toFixed(1);
            $scope.summary.average_memory_usage = isNaN(average) ? 'n/a' : average;
            average = (total_cpu_usage_percent / hostStatistics.length).toFixed(1);
            $scope.summary.average_cpu_usage = isNaN(average) ? 'n/a' : average;
        });
        alertService.getAlerts($scope.summary.selected_cluster).
        then(function(data) {
            $scope.summary.alerts = data;
        });
    }

    mod.controller("SummaryCtrl", ['$scope', '$interval', '$q', 'ClusterService', 'VolumeService', 'HostService', 'UtilService', 'AlertService', summaryCtrl]);
    mod.run(['sessionManager', 'messageUtil', function(sessionManager, messageUtil) {
        sessionManager.exposeSession();
        messageUtil.sendMessageToParent('getSession');
    }]);
}(angular.module('dashboardApp', ['ui.bootstrap', 'plugin.dashboard.services', 'plugin.common'])));
