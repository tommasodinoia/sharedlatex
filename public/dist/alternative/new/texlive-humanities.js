// \ProvidesPackage{epltxchapno}%
// \ProvidesPackage{epltxfn}%
// \ProvidesPackage{expex}
// \ProvidesPackage{adtrees}[2019/07/11 v1.1 Adtrees package]
// \ProvidesPackage{bibleref-lds}[2012/02/26 v1.0 LDS Bible reference style]
// \ProvidesPackage{bibleref-mouth}[2012/02/26 v1.0 Expandable Bible reference style]
// \ProvidesPackage{bibleref-parse}[2011/04/10 v1.1 Parsing of Bible references]
// \ProvidesPackage{bibleref-xidx}[2011/01/19 v1.0 (NLCT) Extended indexing support for bibleref]
// \ProvidesPackage{bibleref}[2020/06/22 1.25 (NLCT and MR)]
// \ProvidesPackage{covington}
// \ProvidesPackage{diadia}[2015/05/20 v1.1 diadia.sty - Josef Kleber (C) 2015]%
// \ProvidesPackage{dramatist}[2014/12/18 v1.2e Package for typesetting drama -- Author: Massimiliano Dominici]
// \ProvidesPackage{dvgloss}[2012/08/06 v0.1 Flexible glossing commands]
// \ProvidesPackage{edfnotes}[2011/02/16 v0.6b
// \ProvidesPackage{eledform}[2015/08/13 v1.1a formalism for eledmac]
// \ProvidesPackage{eledmac}[2017/09/25 v1.24.12 LaTeX port of EDMAC]%
// \ProvidesPackage{eledpar}[2015/09/01 v1.17.1 eledmac extension for parallel texts]%
// \ProvidesPackage{gmverse}
// \ProvidesPackage{alphanum}[1998/07/13 v4.3 alphanumeric section numbers]
// \ProvidesPackage{juraabbrev}[2004/09/15 v0.51]
// \ProvidesPackage{jurabase}[2007/11/15 V0.17 basic jura commands (AS)]
// \ProvidesPackage{jurarsp}[2006/03/04 v0.52]
// \ProvidesPackage{afoot}[2005/03/24 v0.1 PW's version of ArabTeX's afoot.sty]
// \ProvidesPackage{ledarab}[2005/03/24 v0.1 Cooperation between arabtex and ledmac]
// \ProvidesPackage{ledmac}[2016/08/06 v0.19.4 LaTeX port of EDMAC]
// \ProvidesPackage{ledpar}[2015/07/19 v0.14a ledmac extension for parallel texts]
// \ProvidesPackage{lexikon}%
// \ProvidesPackage{lexref}[2015/01/11 v1.1a]%
// \ProvidesPackage{ling-macros}[2016/10/01 package of linguistics macros]				%  package delivery
// %% a \ProvidesPackage line to keep track of versions better
// \ProvidesPackage{linguex}[2013/05/28 Example formatting for linguistics v. 4.3]
// \ProvidesPackage{lingo}[1999/04/05 Make linguistics handouts v. 2.0]
// \ProvidesPackage{ps-trees}[1999/04/27 Linguistic trees in tabular form v. 2.0]
// \ProvidesPackage{liturg}
// \ProvidesPackage{nnext}
// \ProvidesPackage{parallel}[\filedate, setting two texts parallel (me)]
// \ProvidesPackage{parrun}[2004/02/06 v1.1a Package for parallel text]
// \ProvidesPackage{phonrule}
// \ProvidesPackage{play}[1999/03/26 A LaTeX package for typesetting plays]
// \ProvidesPackage{poemscol}
// \ProvidesPackage{poetry}[2019/05/02 v2.2 support for typesetting poetry]
// \ProvidesPackage{poetrytex}[2014/12/12]
// \ifx\ProvidesPackage\undefined  \else
// \ProvidesPackage {qtree} [\qTreeDate v.\qTreeVersion Qtree: tree-drawing for
// \ProvidesPackage{reledmac}[2022/02/04 v2.39.1 typesetting critical editions]%
// \ProvidesPackage{reledpar}[2022/04/22 v2.25.3 reledmac extension for parallel texts]%
// \ProvidesPackage{rrgtrees}[2004/11/14 RRG tree drawing]
// \ProvidesPackage{screenplay-pkg}[2017/08/05 v1.1
// \ProvidesPackage{hardmarg}[2012/06/30 v1.6
// \ProvidesPackage{textglos}%
// \ProvidesPackage{thalie}
// \ProvidesPackage{verse}[2009/09/04 v2.4a verse typesetting]

  var Module = typeof BusytexPipeline !== 'undefined' ? BusytexPipeline : {};

  if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0;
  }

  Module.expectedDataFileDownloads++;
  (function() {
    // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
    if (Module['ENVIRONMENT_IS_PTHREAD'] || Module['$ww']) return;
    var loadPackage = function(metadata) {

      var PACKAGE_PATH = '';
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
      } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
        // web worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
      }
      var PACKAGE_NAME = 'build/wasm/ubuntu/texlive-humanities.data';
      var REMOTE_PACKAGE_BASE = 'texlive-humanities.data';
      if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
        Module['locateFile'] = Module['locateFilePackage'];
        err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
      }
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];

      function fetchRemotePackage(packageName, packageSize, callback, errback) {
        if (typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string') {
          require('fs').readFile(packageName, function(err, contents) {
            if (err) {
              errback(err);
            } else {
              callback(contents.buffer);
            }
          });
          return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', packageName, true);
        xhr.responseType = 'arraybuffer';
        xhr.onprogress = function(event) {
          var url = packageName;
          var size = packageSize;
          if (event.total) size = event.total;
          if (event.loaded) {
            if (!xhr.addedTotal) {
              xhr.addedTotal = true;
              if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
              Module.dataFileDownloads[url] = {
                loaded: event.loaded,
                total: size
              };
            } else {
              Module.dataFileDownloads[url].loaded = event.loaded;
            }
            var total = 0;
            var loaded = 0;
            var num = 0;
            for (var download in Module.dataFileDownloads) {
            var data = Module.dataFileDownloads[download];
              total += data.total;
              loaded += data.loaded;
              num++;
            }
            total = Math.ceil(total * Module.expectedDataFileDownloads/num);
            if (Module['setStatus']) Module['setStatus'](`Downloading data... (${loaded}/${total})`);
          } else if (!Module.dataFileDownloads) {
            if (Module['setStatus']) Module['setStatus']('Downloading data...');
          }
        };
        xhr.onerror = function(event) {
          throw new Error("NetworkError for: " + packageName);
        }
        xhr.onload = function(event) {
          if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            var packageData = xhr.response;
            callback(packageData);
          } else {
            throw new Error(xhr.statusText + " : " + xhr.responseURL);
          }
        };
        xhr.send(null);
      };

      function handleError(error) {
        console.error('package error:', error);
      };

    function runWithFS() {

      function assert(check, msg) {
        if (!check) throw msg + new Error().stack;
      }
Module['FS_createPath']("/", "texmf", true, true);
Module['FS_createPath']("/texmf", "texmf-dist", true, true);
Module['FS_createPath']("/texmf/texmf-dist", "bibtex", true, true);
Module['FS_createPath']("/texmf/texmf-dist/bibtex", "bst", true, true);
Module['FS_createPath']("/texmf/texmf-dist/bibtex/bst", "jurarsp", true, true);
Module['FS_createPath']("/texmf/texmf-dist", "dvips", true, true);
Module['FS_createPath']("/texmf/texmf-dist/dvips", "tree-dvips", true, true);
Module['FS_createPath']("/texmf/texmf-dist", "makeindex", true, true);
Module['FS_createPath']("/texmf/texmf-dist/makeindex", "juraabbrev", true, true);
Module['FS_createPath']("/texmf/texmf-dist", "tex", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex", "generic", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/generic", "expex", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex", "latex", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "adtrees", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "bibleref-lds", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "bibleref-mouth", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "bibleref-parse", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "bibleref", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "covington", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "diadia", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "dramatist", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "dvgloss", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "ecltree", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "edfnotes", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "eledform", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "eledmac", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "gb4e", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "gmverse", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "jura", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "juraabbrev", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "juramisc", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "jurarsp", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "ledmac", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "lexikon", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "lexref", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "ling-macros", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "linguex", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "liturg", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "metrix", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "nnext", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "parallel", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "parrun", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "phonrule", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "plari", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "play", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "poemscol", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "poetry", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "poetrytex", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "qobitree", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "qtree", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "reledmac", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "rrgtrees", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "rtklage", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "screenplay-pkg", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "screenplay", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "sides", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "stage", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "textglos", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "thalie", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "tree-dvips", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "verse", true, true);
Module['FS_createPath']("/texmf/texmf-dist/tex/latex", "xyling", true, true);
Module['FS_createPath']("/", "var", true, true);
Module['FS_createPath']("/var", "log", true, true);

        var PACKAGE_UUID = metadata['package_uuid'];
        var indexedDB;
        if (typeof window === 'object') {
          indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        } else if (typeof location !== 'undefined') {
          // worker
          indexedDB = self.indexedDB;
        } else {
          throw 'using IndexedDB to cache data can only be done on a web page or in a web worker';
        }
        var IDB_RO = "readonly";
        var IDB_RW = "readwrite";
        var DB_NAME = "EM_PRELOAD_CACHE";
        var DB_VERSION = 1;
        var METADATA_STORE_NAME = 'METADATA';
        var PACKAGE_STORE_NAME = 'PACKAGES';
        function openDatabase(callback, errback) {
          try {
            var openRequest = indexedDB.open(DB_NAME, DB_VERSION);
          } catch (e) {
            return errback(e);
          }
          openRequest.onupgradeneeded = function(event) {
            var db = /** @type {IDBDatabase} */ (event.target.result);

            if (db.objectStoreNames.contains(PACKAGE_STORE_NAME)) {
              db.deleteObjectStore(PACKAGE_STORE_NAME);
            }
            var packages = db.createObjectStore(PACKAGE_STORE_NAME);

            if (db.objectStoreNames.contains(METADATA_STORE_NAME)) {
              db.deleteObjectStore(METADATA_STORE_NAME);
            }
            var metadata = db.createObjectStore(METADATA_STORE_NAME);
          };
          openRequest.onsuccess = function(event) {
            var db = /** @type {IDBDatabase} */ (event.target.result);
            callback(db);
          };
          openRequest.onerror = function(error) {
            errback(error);
          };
        };

        // This is needed as chromium has a limit on per-entry files in IndexedDB
        // https://cs.chromium.org/chromium/src/content/renderer/indexed_db/webidbdatabase_impl.cc?type=cs&sq=package:chromium&g=0&l=177
        // https://cs.chromium.org/chromium/src/out/Debug/gen/third_party/blink/public/mojom/indexeddb/indexeddb.mojom.h?type=cs&sq=package:chromium&g=0&l=60
        // We set the chunk size to 64MB to stay well-below the limit
        var CHUNK_SIZE = 64 * 1024 * 1024;

        function cacheRemotePackage(
          db,
          packageName,
          packageData,
          packageMeta,
          callback,
          errback
        ) {
          var transactionPackages = db.transaction([PACKAGE_STORE_NAME], IDB_RW);
          var packages = transactionPackages.objectStore(PACKAGE_STORE_NAME);
          var chunkSliceStart = 0;
          var nextChunkSliceStart = 0;
          var chunkCount = Math.ceil(packageData.byteLength / CHUNK_SIZE);
          var finishedChunks = 0;
          for (var chunkId = 0; chunkId < chunkCount; chunkId++) {
            nextChunkSliceStart += CHUNK_SIZE;
            var putPackageRequest = packages.put(
              packageData.slice(chunkSliceStart, nextChunkSliceStart),
              `package/${packageName}/${chunkId}`
            );
            chunkSliceStart = nextChunkSliceStart;
            putPackageRequest.onsuccess = function(event) {
              finishedChunks++;
              if (finishedChunks == chunkCount) {
                var transaction_metadata = db.transaction(
                  [METADATA_STORE_NAME],
                  IDB_RW
                );
                var metadata = transaction_metadata.objectStore(METADATA_STORE_NAME);
                var putMetadataRequest = metadata.put(
                  {
                    'uuid': packageMeta.uuid,
                    'chunkCount': chunkCount
                  },
                  `metadata/${packageName}`
                );
                putMetadataRequest.onsuccess = function(event) {
                  callback(packageData);
                };
                putMetadataRequest.onerror = function(error) {
                  errback(error);
                };
              }
            };
            putPackageRequest.onerror = function(error) {
              errback(error);
            };
          }
        }

        /* Check if there's a cached package, and if so whether it's the latest available */
        function checkCachedPackage(db, packageName, callback, errback) {
          var transaction = db.transaction([METADATA_STORE_NAME], IDB_RO);
          var metadata = transaction.objectStore(METADATA_STORE_NAME);
          var getRequest = metadata.get(`metadata/${packageName}`);
          getRequest.onsuccess = function(event) {
            var result = event.target.result;
            if (!result) {
              return callback(false, null);
            } else {
              return callback(PACKAGE_UUID === result['uuid'], result);
            }
          };
          getRequest.onerror = function(error) {
            errback(error);
          };
        }

        function fetchCachedPackage(db, packageName, metadata, callback, errback) {
          var transaction = db.transaction([PACKAGE_STORE_NAME], IDB_RO);
          var packages = transaction.objectStore(PACKAGE_STORE_NAME);

          var chunksDone = 0;
          var totalSize = 0;
          var chunkCount = metadata['chunkCount'];
          var chunks = new Array(chunkCount);

          for (var chunkId = 0; chunkId < chunkCount; chunkId++) {
            var getRequest = packages.get(`package/${packageName}/${chunkId}`);
            getRequest.onsuccess = function(event) {
              // If there's only 1 chunk, there's nothing to concatenate it with so we can just return it now
              if (chunkCount == 1) {
                callback(event.target.result);
              } else {
                chunksDone++;
                totalSize += event.target.result.byteLength;
                chunks.push(event.target.result);
                if (chunksDone == chunkCount) {
                  if (chunksDone == 1) {
                    callback(event.target.result);
                  } else {
                    var tempTyped = new Uint8Array(totalSize);
                    var byteOffset = 0;
                    for (var chunkId in chunks) {
                      var buffer = chunks[chunkId];
                      tempTyped.set(new Uint8Array(buffer), byteOffset);
                      byteOffset += buffer.byteLength;
                      buffer = undefined;
                    }
                    chunks = undefined;
                    callback(tempTyped.buffer);
                    tempTyped = undefined;
                  }
                }
              }
            };
            getRequest.onerror = function(error) {
              errback(error);
            };
          }
        }

      function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData');
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        var compressedData = {"data":null,"cachedOffset":982824,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1511,2144,2983,4032,4976,6054,7086,8498,9791,11034,12449,13686,15038,15840,16589,17777,18735,20061,21533,22848,24024,25308,26850,28293,29489,30757,31935,33048,34009,35123,36388,37429,38483,39712,40833,42202,43495,44632,45892,47132,48032,49145,50310,51623,52745,53835,55161,56179,57386,58231,59474,60402,61261,62259,63238,64155,65271,66234,66961,67854,68770,69879,71232,72474,73118,74449,75373,75818,76565,77475,78197,79099,79827,81088,81986,82737,83383,84202,84975,85501,86535,87131,87634,88695,89744,90817,91457,91964,92947,94204,95201,96094,96770,97353,97953,98559,99118,100395,101516,102350,102805,103608,104299,105051,105658,106344,107291,108222,109260,110374,111310,112107,113184,114566,115567,116381,117519,118710,119510,120349,121150,122059,122900,123725,124471,125179,125753,126149,126570,127496,128439,129408,130239,131223,131947,133396,134693,136006,137265,138467,139767,140888,142238,143549,144717,145726,146618,147488,148447,149532,150845,152044,153260,154359,155493,156763,157454,158130,159507,160327,161354,162224,163710,164946,165855,166973,168065,169013,170211,171491,172913,174011,175231,176807,178109,179570,181062,182541,184087,185357,186946,188392,189896,191426,192868,194264,195753,197093,198455,199954,201370,202870,204144,205559,206789,207963,209188,210030,210948,211855,213024,214083,214871,215961,216954,217820,218552,219586,220418,221366,222494,223484,224232,225404,226694,227794,228629,229413,230315,231420,232268,233348,234402,235393,236371,237106,238220,239219,240317,241403,242557,243681,244806,245833,246777,247778,248863,249949,251013,251838,252775,254036,255025,256188,257227,258143,259240,260223,261007,261725,262678,263519,264721,265735,266956,268035,268947,269925,270911,271515,272499,273576,274643,275562,276360,277271,278131,279318,280390,281428,282470,283470,284216,284904,285814,286542,287322,288326,288959,289692,290074,291014,291852,292215,292881,293578,294789,295891,297024,297968,298724,299631,300387,301043,302050,302854,303808,304852,306006,307067,308262,309343,310504,311350,312151,312977,314000,314848,316036,316883,317872,318771,319791,320660,321708,322417,323514,324480,325382,326441,327258,328213,329110,329916,330722,332095,333365,334401,335835,336976,338244,339501,340544,341613,343064,344659,346297,347798,349258,350846,352058,353280,354812,356094,357581,358938,360429,361561,363059,364425,365525,366292,367419,368707,369957,371206,372704,374268,375356,376461,377780,378900,380086,381060,382136,383020,383953,385293,386342,387407,388511,389784,390947,392296,393328,394543,395511,396536,397548,398604,399580,401042,402344,403310,404400,405726,406628,407426,408600,409611,410534,411660,412631,413925,414773,415315,416085,417157,418310,419080,420319,421478,422880,424031,425206,426405,427649,429008,430401,431675,433029,434221,435489,436772,437982,438607,439608,440290,441195,441815,442637,443402,443982,444508,445022,445516,445973,446450,447489,448183,448985,449887,450656,451632,452533,453288,454150,455035,455971,457083,458594,459743,461028,462243,463114,464623,465529,466546,467580,468368,469443,470325,471112,472073,473079,474320,475519,476400,477243,478211,479017,479683,480793,481633,482684,483769,484584,485708,486529,487694,488641,489475,490570,491532,492507,493532,494410,495314,496313,497170,498208,499316,500506,501525,502395,503378,504260,504862,505702,506729,507353,508294,509359,510641,511599,512415,513304,514069,514766,515750,516558,517541,518551,519677,520711,521610,522480,523265,523778,524221,525257,526101,526936,527993,528931,529948,530938,531789,532659,533515,535086,536093,537384,538414,539162,540177,541295,542240,542820,543646,544784,545865,546985,548323,549468,550489,551699,552799,553749,554832,556221,557121,558164,559188,560299,561339,562422,563610,564827,566024,566823,568130,569268,570821,572343,573823,575350,576844,578425,579982,581139,582483,583322,583850,584685,585378,586239,587239,588146,588801,589306,589883,590912,591542,592402,593497,594790,595963,597214,598150,598951,599740,600732,601407,602769,603818,604649,605437,606704,608109,609670,611247,612274,613661,614901,616250,617151,617923,618397,618976,619472,619909,620523,621261,622280,623118,623906,625001,626081,627154,628099,629284,630356,631257,632260,633393,633993,634563,635074,636090,637190,637785,638285,638934,639463,640013,640464,640967,641416,641956,642805,643651,644519,645409,646063,646964,647856,648484,649208,649993,650937,651880,652938,653769,654819,655862,656795,657737,658516,659204,660304,661176,661862,662590,663372,664444,665361,666519,667468,668493,669359,670487,671544,672602,673599,674599,675613,676591,677406,678221,679027,679934,681040,682066,683111,684327,685072,685955,686965,687915,689292,690256,691221,692167,693117,694057,695326,695911,696661,697352,697990,698745,699519,700376,701233,702032,702706,703554,705052,706479,707113,708327,709675,710305,711061,711690,712614,713461,714289,714953,715753,716498,717693,719087,720431,721806,723064,724222,725463,726467,727332,728227,729040,730112,731251,732263,733328,734077,734979,735927,736970,737821,738586,739299,739938,740921,741901,742698,743485,744529,745310,746316,747482,748439,749431,750679,751848,752882,753968,755007,755948,756765,757532,758194,759259,760327,761333,762230,763237,764414,765469,766512,767542,768600,769761,770809,771839,772901,773781,774738,775661,776614,777716,778589,779479,780511,781746,782953,783816,784855,785813,786840,787987,789033,790192,791228,792174,793157,794329,795408,796406,797451,798418,799454,800323,801432,802304,803455,804361,805255,806357,807264,808302,809231,810195,810951,811698,812548,813328,813898,814814,815784,816739,817795,818421,819494,820286,821186,822085,822786,823494,824274,825380,826285,826786,827668,828670,829605,830614,831505,832516,833604,834650,835290,835815,836945,837932,838983,840023,840877,841759,842721,843656,844697,845692,846831,847772,848734,849655,850240,851011,852029,852602,853445,854112,854900,855774,856642,857040,857692,858543,859616,860513,861789,862897,863561,864599,865676,866606,867489,868207,869052,869970,870974,871983,872907,873958,875062,876106,877101,878033,879140,880197,881268,882436,883341,884192,885216,885931,886967,887965,889013,890157,891176,892274,893195,894325,895256,895789,896427,897418,898095,899166,900013,900957,901840,902866,903615,904661,905575,906442,907367,908245,909391,910744,911637,912865,914199,915550,916999,918160,919341,920505,921888,922969,924225,925721,927172,928363,929873,931253,932637,934018,934958,935700,936357,937490,938515,939185,940065,941080,942088,943268,944349,945189,946414,947844,949115,950401,951502,952940,954175,955129,956082,957324,958347,959521,960575,961969,963633,965235,966771,967994,969078,970218,971460,972258,973458,974368,975639,976859,978369,979492,980742,982073],"sizes":[1511,633,839,1049,944,1078,1032,1412,1293,1243,1415,1237,1352,802,749,1188,958,1326,1472,1315,1176,1284,1542,1443,1196,1268,1178,1113,961,1114,1265,1041,1054,1229,1121,1369,1293,1137,1260,1240,900,1113,1165,1313,1122,1090,1326,1018,1207,845,1243,928,859,998,979,917,1116,963,727,893,916,1109,1353,1242,644,1331,924,445,747,910,722,902,728,1261,898,751,646,819,773,526,1034,596,503,1061,1049,1073,640,507,983,1257,997,893,676,583,600,606,559,1277,1121,834,455,803,691,752,607,686,947,931,1038,1114,936,797,1077,1382,1001,814,1138,1191,800,839,801,909,841,825,746,708,574,396,421,926,943,969,831,984,724,1449,1297,1313,1259,1202,1300,1121,1350,1311,1168,1009,892,870,959,1085,1313,1199,1216,1099,1134,1270,691,676,1377,820,1027,870,1486,1236,909,1118,1092,948,1198,1280,1422,1098,1220,1576,1302,1461,1492,1479,1546,1270,1589,1446,1504,1530,1442,1396,1489,1340,1362,1499,1416,1500,1274,1415,1230,1174,1225,842,918,907,1169,1059,788,1090,993,866,732,1034,832,948,1128,990,748,1172,1290,1100,835,784,902,1105,848,1080,1054,991,978,735,1114,999,1098,1086,1154,1124,1125,1027,944,1001,1085,1086,1064,825,937,1261,989,1163,1039,916,1097,983,784,718,953,841,1202,1014,1221,1079,912,978,986,604,984,1077,1067,919,798,911,860,1187,1072,1038,1042,1000,746,688,910,728,780,1004,633,733,382,940,838,363,666,697,1211,1102,1133,944,756,907,756,656,1007,804,954,1044,1154,1061,1195,1081,1161,846,801,826,1023,848,1188,847,989,899,1020,869,1048,709,1097,966,902,1059,817,955,897,806,806,1373,1270,1036,1434,1141,1268,1257,1043,1069,1451,1595,1638,1501,1460,1588,1212,1222,1532,1282,1487,1357,1491,1132,1498,1366,1100,767,1127,1288,1250,1249,1498,1564,1088,1105,1319,1120,1186,974,1076,884,933,1340,1049,1065,1104,1273,1163,1349,1032,1215,968,1025,1012,1056,976,1462,1302,966,1090,1326,902,798,1174,1011,923,1126,971,1294,848,542,770,1072,1153,770,1239,1159,1402,1151,1175,1199,1244,1359,1393,1274,1354,1192,1268,1283,1210,625,1001,682,905,620,822,765,580,526,514,494,457,477,1039,694,802,902,769,976,901,755,862,885,936,1112,1511,1149,1285,1215,871,1509,906,1017,1034,788,1075,882,787,961,1006,1241,1199,881,843,968,806,666,1110,840,1051,1085,815,1124,821,1165,947,834,1095,962,975,1025,878,904,999,857,1038,1108,1190,1019,870,983,882,602,840,1027,624,941,1065,1282,958,816,889,765,697,984,808,983,1010,1126,1034,899,870,785,513,443,1036,844,835,1057,938,1017,990,851,870,856,1571,1007,1291,1030,748,1015,1118,945,580,826,1138,1081,1120,1338,1145,1021,1210,1100,950,1083,1389,900,1043,1024,1111,1040,1083,1188,1217,1197,799,1307,1138,1553,1522,1480,1527,1494,1581,1557,1157,1344,839,528,835,693,861,1000,907,655,505,577,1029,630,860,1095,1293,1173,1251,936,801,789,992,675,1362,1049,831,788,1267,1405,1561,1577,1027,1387,1240,1349,901,772,474,579,496,437,614,738,1019,838,788,1095,1080,1073,945,1185,1072,901,1003,1133,600,570,511,1016,1100,595,500,649,529,550,451,503,449,540,849,846,868,890,654,901,892,628,724,785,944,943,1058,831,1050,1043,933,942,779,688,1100,872,686,728,782,1072,917,1158,949,1025,866,1128,1057,1058,997,1000,1014,978,815,815,806,907,1106,1026,1045,1216,745,883,1010,950,1377,964,965,946,950,940,1269,585,750,691,638,755,774,857,857,799,674,848,1498,1427,634,1214,1348,630,756,629,924,847,828,664,800,745,1195,1394,1344,1375,1258,1158,1241,1004,865,895,813,1072,1139,1012,1065,749,902,948,1043,851,765,713,639,983,980,797,787,1044,781,1006,1166,957,992,1248,1169,1034,1086,1039,941,817,767,662,1065,1068,1006,897,1007,1177,1055,1043,1030,1058,1161,1048,1030,1062,880,957,923,953,1102,873,890,1032,1235,1207,863,1039,958,1027,1147,1046,1159,1036,946,983,1172,1079,998,1045,967,1036,869,1109,872,1151,906,894,1102,907,1038,929,964,756,747,850,780,570,916,970,955,1056,626,1073,792,900,899,701,708,780,1106,905,501,882,1002,935,1009,891,1011,1088,1046,640,525,1130,987,1051,1040,854,882,962,935,1041,995,1139,941,962,921,585,771,1018,573,843,667,788,874,868,398,652,851,1073,897,1276,1108,664,1038,1077,930,883,718,845,918,1004,1009,924,1051,1104,1044,995,932,1107,1057,1071,1168,905,851,1024,715,1036,998,1048,1144,1019,1098,921,1130,931,533,638,991,677,1071,847,944,883,1026,749,1046,914,867,925,878,1146,1353,893,1228,1334,1351,1449,1161,1181,1164,1383,1081,1256,1496,1451,1191,1510,1380,1384,1381,940,742,657,1133,1025,670,880,1015,1008,1180,1081,840,1225,1430,1271,1286,1101,1438,1235,954,953,1242,1023,1174,1054,1394,1664,1602,1536,1223,1084,1140,1242,798,1200,910,1271,1220,1510,1123,1250,1331,751],"successes":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof Module['LZ4'] === 'object', 'LZ4 not present - was your app build with -sLZ4?');
            Module['LZ4'].loadPackage({ 'metadata': metadata, 'compressedData': compressedData }, false);
            Module['removeRunDependency']('datafile_build/wasm/ubuntu/texlive-humanities.data');
      };
      Module['addRunDependency']('datafile_build/wasm/ubuntu/texlive-humanities.data');

      if (!Module.preloadResults) Module.preloadResults = {};

        function preloadFallback(error) {
          console.error(error);
          console.error('falling back to default preload behavior');
          fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, processPackageData, handleError);
        };

        openDatabase(
          function(db) {
            checkCachedPackage(db, PACKAGE_PATH + PACKAGE_NAME,
              function(useCached, metadata) {
                Module.preloadResults[PACKAGE_NAME] = {fromCache: useCached};
                if (useCached) {
                  fetchCachedPackage(db, PACKAGE_PATH + PACKAGE_NAME, metadata, processPackageData, preloadFallback);
                } else {
                  fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE,
                    function(packageData) {
                      cacheRemotePackage(db, PACKAGE_PATH + PACKAGE_NAME, packageData, {uuid:PACKAGE_UUID}, processPackageData,
                        function(error) {
                          console.error(error);
                          processPackageData(packageData);
                        });
                    }
                  , preloadFallback);
                }
              }
            , preloadFallback);
          }
        , preloadFallback);

        if (Module['setStatus']) Module['setStatus']('Downloading...');

    }
    if (Module['calledRun']) {
      runWithFS();
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
    }

    }
    loadPackage({"files": [{"filename": "/texmf/texmf-dist/bibtex/bst/jurarsp/jurarsp.bst", "start": 0, "end": 6834}, {"filename": "/texmf/texmf-dist/dvips/tree-dvips/tree-dvips91.pro", "start": 6834, "end": 15097}, {"filename": "/texmf/texmf-dist/makeindex/juraabbrev/laws.ist", "start": 15097, "end": 17189}, {"filename": "/texmf/texmf-dist/tex/generic/expex/epltxchapno.sty", "start": 17189, "end": 18737}, {"filename": "/texmf/texmf-dist/tex/generic/expex/epltxfn.sty", "start": 18737, "end": 19174}, {"filename": "/texmf/texmf-dist/tex/generic/expex/eptexfn.tex", "start": 19174, "end": 20146}, {"filename": "/texmf/texmf-dist/tex/generic/expex/expex-demo.tex", "start": 20146, "end": 45227}, {"filename": "/texmf/texmf-dist/tex/generic/expex/expex.sty", "start": 45227, "end": 45352}, {"filename": "/texmf/texmf-dist/tex/generic/expex/expex.tex", "start": 45352, "end": 96005}, {"filename": "/texmf/texmf-dist/tex/latex/adtrees/adtrees.sty", "start": 96005, "end": 133152}, {"filename": "/texmf/texmf-dist/tex/latex/bibleref-lds/bibleref-lds.sty", "start": 133152, "end": 150171}, {"filename": "/texmf/texmf-dist/tex/latex/bibleref-mouth/bibleref-mouth.sty", "start": 150171, "end": 182562}, {"filename": "/texmf/texmf-dist/tex/latex/bibleref-parse/bibleref-parse.sty", "start": 182562, "end": 230738}, {"filename": "/texmf/texmf-dist/tex/latex/bibleref/bibleref-xidx.sty", "start": 230738, "end": 238620}, {"filename": "/texmf/texmf-dist/tex/latex/bibleref/bibleref.sty", "start": 238620, "end": 276861}, {"filename": "/texmf/texmf-dist/tex/latex/covington/covington.sty", "start": 276861, "end": 311716}, {"filename": "/texmf/texmf-dist/tex/latex/diadia/diadia-english.trsl", "start": 311716, "end": 313926}, {"filename": "/texmf/texmf-dist/tex/latex/diadia/diadia-fallback.trsl", "start": 313926, "end": 316112}, {"filename": "/texmf/texmf-dist/tex/latex/diadia/diadia-german.trsl", "start": 316112, "end": 318296}, {"filename": "/texmf/texmf-dist/tex/latex/diadia/diadia.cfg", "start": 318296, "end": 324368}, {"filename": "/texmf/texmf-dist/tex/latex/diadia/diadia.sty", "start": 324368, "end": 332577}, {"filename": "/texmf/texmf-dist/tex/latex/dramatist/dramatist.sty", "start": 332577, "end": 345704}, {"filename": "/texmf/texmf-dist/tex/latex/dvgloss/dvgloss.sty", "start": 345704, "end": 349545}, {"filename": "/texmf/texmf-dist/tex/latex/ecltree/ecltree.sty", "start": 349545, "end": 354225}, {"filename": "/texmf/texmf-dist/tex/latex/edfnotes/edfnotes.sty", "start": 354225, "end": 395829}, {"filename": "/texmf/texmf-dist/tex/latex/eledform/eledform.sty", "start": 395829, "end": 398763}, {"filename": "/texmf/texmf-dist/tex/latex/eledmac/eledmac.sty", "start": 398763, "end": 587110}, {"filename": "/texmf/texmf-dist/tex/latex/eledmac/eledpar.sty", "start": 587110, "end": 666338}, {"filename": "/texmf/texmf-dist/tex/latex/gb4e/cgloss4e.sty", "start": 666338, "end": 672433}, {"filename": "/texmf/texmf-dist/tex/latex/gb4e/gb4e.sty", "start": 672433, "end": 686435}, {"filename": "/texmf/texmf-dist/tex/latex/gmverse/gmverse.sty", "start": 686435, "end": 716780}, {"filename": "/texmf/texmf-dist/tex/latex/jura/alphanum.sty", "start": 716780, "end": 725003}, {"filename": "/texmf/texmf-dist/tex/latex/jura/jura.cls", "start": 725003, "end": 729066}, {"filename": "/texmf/texmf-dist/tex/latex/juraabbrev/juraabbrev.4ht", "start": 729066, "end": 731347}, {"filename": "/texmf/texmf-dist/tex/latex/juraabbrev/juraabbrev.sty", "start": 731347, "end": 738136}, {"filename": "/texmf/texmf-dist/tex/latex/juramisc/jbgoe.clo", "start": 738136, "end": 739401}, {"filename": "/texmf/texmf-dist/tex/latex/juramisc/jbstgallen.clo", "start": 739401, "end": 740777}, {"filename": "/texmf/texmf-dist/tex/latex/juramisc/jbtrier.clo", "start": 740777, "end": 741786}, {"filename": "/texmf/texmf-dist/tex/latex/juramisc/jurabase.sty", "start": 741786, "end": 752141}, {"filename": "/texmf/texmf-dist/tex/latex/juramisc/jurabook.cls", "start": 752141, "end": 836901}, {"filename": "/texmf/texmf-dist/tex/latex/juramisc/juraovw.cls", "start": 836901, "end": 841497}, {"filename": "/texmf/texmf-dist/tex/latex/juramisc/juraurtl.cls", "start": 841497, "end": 846976}, {"filename": "/texmf/texmf-dist/tex/latex/jurarsp/jurarsp.cfg", "start": 846976, "end": 847779}, {"filename": "/texmf/texmf-dist/tex/latex/jurarsp/jurarsp.sty", "start": 847779, "end": 901337}, {"filename": "/texmf/texmf-dist/tex/latex/ledmac/afoot.sty", "start": 901337, "end": 905318}, {"filename": "/texmf/texmf-dist/tex/latex/ledmac/ledarab.sty", "start": 905318, "end": 911552}, {"filename": "/texmf/texmf-dist/tex/latex/ledmac/ledmac.sty", "start": 911552, "end": 1009305}, {"filename": "/texmf/texmf-dist/tex/latex/ledmac/ledpar.sty", "start": 1009305, "end": 1065169}, {"filename": "/texmf/texmf-dist/tex/latex/lexikon/lexikon.sty", "start": 1065169, "end": 1070107}, {"filename": "/texmf/texmf-dist/tex/latex/lexref/lexref.sty", "start": 1070107, "end": 1086640}, {"filename": "/texmf/texmf-dist/tex/latex/ling-macros/ling-macros.sty", "start": 1086640, "end": 1106203}, {"filename": "/texmf/texmf-dist/tex/latex/linguex/linguex.sty", "start": 1106203, "end": 1124161}, {"filename": "/texmf/texmf-dist/tex/latex/linguex/linguho.sty", "start": 1124161, "end": 1128615}, {"filename": "/texmf/texmf-dist/tex/latex/linguex/ps-trees.sty", "start": 1128615, "end": 1132323}, {"filename": "/texmf/texmf-dist/tex/latex/liturg/liturg.sty", "start": 1132323, "end": 1149686}, {"filename": "/texmf/texmf-dist/tex/latex/metrix/metrix.sty", "start": 1149686, "end": 1179921}, {"filename": "/texmf/texmf-dist/tex/latex/nnext/nnext.sty", "start": 1179921, "end": 1182769}, {"filename": "/texmf/texmf-dist/tex/latex/parallel/parallel.sty", "start": 1182769, "end": 1196775}, {"filename": "/texmf/texmf-dist/tex/latex/parrun/parrun.sty", "start": 1196775, "end": 1205212}, {"filename": "/texmf/texmf-dist/tex/latex/phonrule/phonrule.sty", "start": 1205212, "end": 1206846}, {"filename": "/texmf/texmf-dist/tex/latex/plari/plari.cls", "start": 1206846, "end": 1210929}, {"filename": "/texmf/texmf-dist/tex/latex/play/play.cls", "start": 1210929, "end": 1215595}, {"filename": "/texmf/texmf-dist/tex/latex/play/play.sty", "start": 1215595, "end": 1219261}, {"filename": "/texmf/texmf-dist/tex/latex/poemscol/poemscol.sty", "start": 1219261, "end": 1383134}, {"filename": "/texmf/texmf-dist/tex/latex/poetry/poetry.sty", "start": 1383134, "end": 1394183}, {"filename": "/texmf/texmf-dist/tex/latex/poetrytex/poetrytex.sty", "start": 1394183, "end": 1405621}, {"filename": "/texmf/texmf-dist/tex/latex/qobitree/qobitree.tex", "start": 1405621, "end": 1429878}, {"filename": "/texmf/texmf-dist/tex/latex/qtree/qtree.sty", "start": 1429878, "end": 1467718}, {"filename": "/texmf/texmf-dist/tex/latex/reledmac/reledmac.sty", "start": 1467718, "end": 1767743}, {"filename": "/texmf/texmf-dist/tex/latex/reledmac/reledpar.sty", "start": 1767743, "end": 1871179}, {"filename": "/texmf/texmf-dist/tex/latex/rrgtrees/rrgtrees.sty", "start": 1871179, "end": 1879374}, {"filename": "/texmf/texmf-dist/tex/latex/rtklage/rtklage.cls", "start": 1879374, "end": 1881732}, {"filename": "/texmf/texmf-dist/tex/latex/screenplay-pkg/screenplay-pkg.sty", "start": 1881732, "end": 1887863}, {"filename": "/texmf/texmf-dist/tex/latex/screenplay/hardmarg.sty", "start": 1887863, "end": 1889503}, {"filename": "/texmf/texmf-dist/tex/latex/screenplay/screenplay.cls", "start": 1889503, "end": 1895997}, {"filename": "/texmf/texmf-dist/tex/latex/sides/sides.cls", "start": 1895997, "end": 1902770}, {"filename": "/texmf/texmf-dist/tex/latex/stage/stage.cls", "start": 1902770, "end": 1908557}, {"filename": "/texmf/texmf-dist/tex/latex/textglos/textglos.sty", "start": 1908557, "end": 1911769}, {"filename": "/texmf/texmf-dist/tex/latex/thalie/thalie-english.trsl", "start": 1911769, "end": 1912770}, {"filename": "/texmf/texmf-dist/tex/latex/thalie/thalie-fallback.trsl", "start": 1912770, "end": 1914413}, {"filename": "/texmf/texmf-dist/tex/latex/thalie/thalie-french.trsl", "start": 1914413, "end": 1915440}, {"filename": "/texmf/texmf-dist/tex/latex/thalie/thalie-german.trsl", "start": 1915440, "end": 1916507}, {"filename": "/texmf/texmf-dist/tex/latex/thalie/thalie-italian.trsl", "start": 1916507, "end": 1917529}, {"filename": "/texmf/texmf-dist/tex/latex/thalie/thalie.sty", "start": 1917529, "end": 1936269}, {"filename": "/texmf/texmf-dist/tex/latex/tree-dvips/lingmacros.sty", "start": 1936269, "end": 1945775}, {"filename": "/texmf/texmf-dist/tex/latex/tree-dvips/tree-dvips.sty", "start": 1945775, "end": 1954327}, {"filename": "/texmf/texmf-dist/tex/latex/verse/verse.sty", "start": 1954327, "end": 1963363}, {"filename": "/texmf/texmf-dist/tex/latex/xyling/xyling.sty", "start": 1963363, "end": 1998026}, {"filename": "/var/log/texlive-humanities.js.skip.txt", "start": 1998026, "end": 1998517}], "remote_package_size": 986920, "package_uuid": "sha256-2c9ce9b3aedfd8ac56dec068c19fe80aa6965695e689763c879812b8a2e332a0"});

  })();
