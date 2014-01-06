/*
This snippet is an angular service that defines the logic behind the loading of new images in the gallery. There's an
infinite scroller mechanism in place, managed by this service
*/
angular.module('eversnapServices',[]).factory('sharedInfiniteScroller',['$rootScope', 'SharedAlbumInfo', 'api', function($rootScope, SharedAlbumInfo, api) {
        var sharedInfiniteScroller = {}, picturesPerTime = 25, album_code;
        var resources = [], next = false, limit = 500, offset = 1000, filteredResources = [], album='', visibleResources = [];

        sharedInfiniteScroller.setNext = function(n) {
            next = n;
        }

        sharedInfiniteScroller.getNext = function() {
            return next;
        }

        // initial resources
        sharedInfiniteScroller.setResources = function(res) {
            resources = filteredResources = res;
            this.setVisibleResources(resources.slice(0, picturesPerTime-1));
            this.broadcastVisibleResources();
        };
        sharedInfiniteScroller.setAlbumCode = function(code)
        {
            album_code = code;
        }

        sharedInfiniteScroller.getAlbumCode = function()
        {
            return album_code;
        }

        //if the user filters the resources we need to show only the selected ones
        sharedInfiniteScroller.setFilteredResources = function(fres) {
            filteredResources = fres;
            this.setVisibleResources(filteredResources.slice(0, picturesPerTime-1));
            this.broadcastVisibleResources();
        };

        /*
        when the user scrolling reaches a selected point, this method is called and it calls an api to fetch other resources
        from the backend
        */
        sharedInfiniteScroller.loadNextResources = function() {
            var addedResources = filteredResources.slice(visibleResources.length, visibleResources.length + picturesPerTime);
            visibleResources = visibleResources.concat(addedResources);

            if ((visibleResources.length > limit) && (next) ){
                limit += offset;
                var new_resourcesPromise = api.getOtherResources(album , filteredResources.length);
                new_resourcesPromise.then(function(data) {
                    filteredResources = filteredResources.concat(data.objects);
                    next = data.next;
                }, function(data) {
                    limit -= offset;
                });
            }

            if (addedResources.length != 0) {
                this.broadcastVisibleResources();
            }
        };

        sharedInfiniteScroller.setVisibleResources= function(vResources) {
            visibleResources = vResources;
        };

        sharedInfiniteScroller.getVisibleResources= function() {
            return visibleResources;
        };
        sharedInfiniteScroller.setAlbum= function(album_id) {
            album = album_id;
        };
        sharedInfiniteScroller.getAlbum= function () {
            return album;
        };
        sharedInfiniteScroller.getResources =  function() {
            return resources;
        };
        sharedInfiniteScroller.broadcastVisibleResources = function() {
            $rootScope.$broadcast('visibleResourcesBroadcast');

        }
        return sharedInfiniteScroller;


    }])