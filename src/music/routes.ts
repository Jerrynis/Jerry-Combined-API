/**
 * Route definitions for NetEase Cloud Music API
 * Each route: { url, crypto, method?, dataTransform? }
 * If a route is not listed here, it defaults to { url: '/api/<route>', crypto: 'weapi' }
 */

export interface RouteConfig {
  url: string | ((query: Record<string, any>) => string)
  crypto: string
  desc?: string
  params?: string[]
  dataTransform?: (query: Record<string, any>) => Record<string, any>
}

export const routes: Record<string, RouteConfig> = {
  // ==================== 登录 ====================
  'login/cellphone': {
    url: '/api/login/cellphone',
    crypto: 'weapi',
    desc: '手机登录',
    params: ['phone', 'password', 'captcha', 'countrycode', 'rememberLogin'],
  },
  'login/email': {
    url: '/api/login',
    crypto: 'weapi',
    desc: '邮箱登录',
    params: ['email', 'password', 'rememberLogin'],
  },
  'login/qr/key': {
    url: '/api/login/qrcode/unikey',
    crypto: 'weapi',
    desc: '二维码登录-生成key',
    params: ['type'],
    dataTransform: (query) => ({ type: parseInt(query.type || 1) }),
  },
  'login/qr/create': {
    url: '/api/login/qrcode/client/login',
    crypto: 'weapi',
    desc: '二维码登录-生成二维码',
    params: ['key', 'qrimg', 'type'],
    dataTransform: (query) => ({
      key: query.key,
      qrimg: query.qrimg || '',
      type: parseInt(query.type || 1),
    }),
  },
  'login/qr/check': {
    url: '/api/login/qrcode/client/scan',
    crypto: 'weapi',
    desc: '二维码登录-检查状态',
    params: ['key', 'type'],
  },
  'login/status': {
    url: '/api/nuser/account/get',
    crypto: 'weapi',
    desc: '登录状态',
    params: [],
  },
  'logout': {
    url: '/api/logout',
    crypto: 'weapi',
    desc: '退出登录',
    params: [],
  },
  'register/cellphone': {
    url: '/api/register/cellphone',
    crypto: 'weapi',
    desc: '注册(手机)',
    params: ['captcha', 'phone', 'password', 'nickname'],
  },
  'captcha/sent': {
    url: '/api/sms/captcha/sent',
    crypto: 'weapi',
    desc: '发送验证码',
    params: ['cellphone', 'ctcode'],
  },
  'captcha/verify': {
    url: '/api/sms/captcha/verify',
    crypto: 'weapi',
    desc: '验证验证码',
    params: ['cellphone', 'captcha', 'ctcode'],
  },

  // ==================== 歌曲 ====================
  'song/detail': {
    url: '/api/v3/song/detail',
    crypto: 'weapi',
    desc: '歌曲详情',
    params: ['ids'],
    dataTransform: (query) => {
      const raw = query.ids || query.id;
      const idArr = Array.isArray(raw) ? raw : String(raw).split(',');
      return {
        c: '[' + idArr.map((id: string) => JSON.stringify({ id: String(id).trim() })).join(',') + ']',
      };
    },
  },
  'song/url': {
    url: '/api/song/enhance/player/url',
    crypto: 'linuxapi',
    desc: '歌曲URL',
    params: ['id', 'br'],
    dataTransform: (query) => {
      const raw = query.ids || query.id;
      const idArr = Array.isArray(raw) ? raw : String(raw).split(',');
      return {
        ids: idArr.map((id: string) => String(id).trim()),
        br: parseInt(query.br || 999000),
      };
    },
  },
  'song/url/v1': {
    url: '/api/song/enhance/player/url/v1',
    crypto: 'weapi',
    desc: '歌曲URL(v1,多音质)',
    params: ['id', 'level', 'encodeType'],
    dataTransform: (query) => {
      const raw = query.ids || query.id;
      const idArr = Array.isArray(raw) ? raw : String(raw).split(',');
      return {
        ids: idArr.map((id: string) => String(id).trim()),
        level: query.level || 'exhigh',
        encodeType: query.encodeType || 'flac',
      };
    },
  },
  'song/url/match': {
    url: '/api/song/enhance/player/url',
    crypto: 'unblock',
    desc: '直接解灰(多音源匹配)',
    params: ['id', 'source'],
  },
  'song/lyric': {
    url: '/api/song/lyric',
    crypto: 'linuxapi',
    desc: '歌词',
    params: ['id', 'lv', 'kv', 'tv'],
    dataTransform: (query) => ({
      id: parseInt(query.id),
      lv: parseInt(query.lv || -1),
      kv: parseInt(query.kv || -1),
      tv: parseInt(query.tv || -1),
    }),
  },
  'song/download/url': {
    url: '/api/song/enhance/download/url',
    crypto: 'weapi',
    desc: '歌曲下载URL',
    params: ['id', 'br'],
  },
  'check_music': {
    url: '/api/check/music',
    crypto: 'weapi',
    desc: '检查音乐是否可用',
    params: ['id', 'br'],
  },
  'song/order': {
    url: '/api/song/order',
    crypto: 'weapi',
    desc: '歌曲排序',
    params: ['pid', 'ids', 'op'],
  },

  // ==================== 搜索 ====================
  'search': {
    url: '/api/search/get',
    crypto: 'weapi',
    desc: '搜索',
    params: ['keywords', 'limit', 'offset', 'type'],
    dataTransform: (query) => ({
      s: query.keywords || '',
      type: query.type || 1,
      limit: parseInt(query.limit || 30),
      offset: parseInt(query.offset || 0),
    }),
  },
  'cloudsearch': {
    url: '/api/cloudsearch/get/web',
    crypto: 'weapi',
    desc: '云搜索(更多结果)',
    params: ['keywords', 'limit', 'offset', 'type'],
    dataTransform: (query) => ({
      s: query.keywords || '',
      type: query.type || 1,
      limit: parseInt(query.limit || 30),
      offset: parseInt(query.offset || 0),
    }),
  },
  'search/multimatch': {
    url: '/api/search/multimatch',
    crypto: 'weapi',
    desc: '多重搜索',
    params: ['type', 'keywords'],
  },
  'search/hot': {
    url: '/api/search/hot',
    crypto: 'weapi',
    desc: '热搜',
    params: ['type'],
    dataTransform: (query) => ({ type: query.type || 1111 }),
  },
  'search/hot/detail': {
    url: '/api/hotsearchlist/get',
    crypto: 'weapi',
    desc: '热搜详情',
    params: [],
  },
  'search/suggest': {
    url: '/api/search/suggest/keyword',
    crypto: 'weapi',
    desc: '搜索建议',
    params: ['keywords'],
    dataTransform: (query) => ({ s: query.keywords || '' }),
  },

  // ==================== 歌单 ====================
  'playlist/detail': {
    url: '/api/v3/playlist/detail',
    crypto: 'weapi',
    desc: '歌单详情',
    params: ['id', 'n'],
    dataTransform: (query) => ({
      id: parseInt(query.id),
      n: parseInt(query.n || 1000),
    }),
  },
  'playlist/track/all': {
    url: '/api/v6/playlist/detail',
    crypto: 'weapi',
    desc: '歌单全部歌曲',
    params: ['id', 'limit', 'offset', 'order'],
  },
  'playlist/catlist': {
    url: '/api/playlist/catalogue',
    crypto: 'weapi',
    desc: '歌单分类',
    params: [],
  },
  'playlist/hot': {
    url: '/api/playlist/hot',
    crypto: 'weapi',
    desc: '热门歌单分类',
    params: [],
  },
  'playlist/create': {
    url: '/api/playlist/create',
    crypto: 'weapi',
    desc: '创建歌单',
    params: ['name', 'privacy'],
  },
  'playlist/delete': {
    url: '/api/playlist/delete',
    crypto: 'weapi',
    desc: '删除歌单',
    params: ['id'],
  },
  'playlist/tracks': {
    url: '/api/playlist/manipulate/tracks',
    crypto: 'weapi',
    desc: '歌单添加/删除歌曲',
    params: ['op', 'pid', 'tracks', 'trackIds'],
  },
  'playlist/subscribe': {
    url: '/api/playlist/subscribe',
    crypto: 'weapi',
    desc: '收藏歌单',
    params: ['id', 't'],
  },
  'playlist/highquality': {
    url: '/api/v3/playlist/highquality/list',
    crypto: 'weapi',
    desc: '精品歌单',
    params: ['cat', 'limit', 'lasttime'],
  },
  'playlist/name/update': {
    url: '/api/playlist/name/update',
    crypto: 'weapi',
    desc: '更新歌单名',
    params: ['id', 'name'],
  },
  'playlist/desc/update': {
    url: '/api/playlist/desc/update',
    crypto: 'weapi',
    desc: '更新歌单描述',
    params: ['id', 'desc'],
  },

  // ==================== 用户 ====================
  'user/detail': {
    url: (q) => '/api/v1/user/detail/' + q.uid,
    crypto: 'weapi',
    desc: '用户详情',
    params: ['uid'],
  },
  'user/playlist': {
    url: '/api/user/playlist',
    crypto: 'weapi',
    desc: '用户歌单',
    params: ['uid', 'limit', 'offset'],
  },
  'user/record': {
    url: '/api/v1/play/record',
    crypto: 'weapi',
    desc: '用户播放记录',
    params: ['uid', 'type'],
  },
  'user/account': {
    url: '/api/nuser/account/get',
    crypto: 'weapi',
    desc: '账号信息',
    params: [],
  },
  'user/subcount': {
    url: '/api/subcount',
    crypto: 'weapi',
    desc: '用户关注数',
    params: [],
  },
  'user/follows': {
    url: '/api/user/getfollows',
    crypto: 'weapi',
    desc: '用户关注列表',
    params: ['uid', 'limit', 'offset'],
  },
  'user/followeds': {
    url: '/api/user/getfolloweds',
    crypto: 'linuxapi',
    desc: '用户粉丝列表',
    params: ['uid', 'limit', 'offset', 'time'],
  },
  'user/update': {
    url: '/api/user/profile/update',
    crypto: 'weapi',
    desc: '更新用户信息',
    params: ['gender', 'birthday', 'nickname', 'province', 'city', 'signature'],
  },

  // ==================== 歌手 ====================
  'artist/songs': {
    url: '/api/v1/artist/songs',
    crypto: 'weapi',
    desc: '歌手歌曲',
    params: ['id', 'limit', 'offset', 'order'],
    dataTransform: (query) => ({
      id: query.id,
      limit: parseInt(query.limit || 30),
      offset: parseInt(query.offset || 0),
      order: query.order || 'hot',
      private_cloud: 'true',
      work_type: 1,
    }),
  },
  'artist/detail': {
    url: '/api/artist/head/info/get',
    crypto: 'weapi',
    desc: '歌手详情',
    params: ['id'],
  },
  'artist/desc': {
    url: '/api/artist/introduction',
    crypto: 'weapi',
    desc: '歌手描述',
    params: ['id'],
  },
  'artists': {
    url: '/api/artist/albums',
    crypto: 'weapi',
    desc: '歌手专辑',
    params: ['id', 'limit', 'offset'],
  },
  'artist/list': {
    url: '/api/artist/list',
    crypto: 'weapi',
    desc: '歌手列表',
    params: ['cat', 'limit', 'offset', 'initial'],
  },
  'artist/sub': {
    url: '/api/artist/sub',
    crypto: 'weapi',
    desc: '收藏歌手',
    params: ['id', 't'],
  },
  'artist/sublist': {
    url: '/api/artist/sublist',
    crypto: 'weapi',
    desc: '收藏的歌手列表',
    params: ['limit', 'offset'],
  },
  'artist/top/song': {
    url: '/api/artist/top/song',
    crypto: 'weapi',
    desc: '歌手热门50首',
    params: ['id'],
  },

  // ==================== 专辑 ====================
  'album': {
    url: '/api/album/detail',
    crypto: 'weapi',
    desc: '专辑详情',
    params: ['id'],
  },
  'album/detail/dynamic': {
    url: '/api/album/detail/dynamic',
    crypto: 'weapi',
    desc: '专辑动态信息',
    params: ['id'],
  },
  'album/new': {
    url: '/api/album/new',
    crypto: 'weapi',
    desc: '新碟上架',
    params: ['limit', 'offset', 'area'],
  },
  'album/newest': {
    url: '/api/album/newest',
    crypto: 'weapi',
    desc: '最新专辑',
    params: ['limit', 'offset'],
  },
  'album/sub': {
    url: '/api/album/sub',
    crypto: 'weapi',
    desc: '收藏专辑',
    params: ['id', 't'],
  },
  'album/sublist': {
    url: '/api/album/sublist',
    crypto: 'weapi',
    desc: '收藏的专辑列表',
    params: ['limit', 'offset'],
  },

  // ==================== MV ====================
  'mv/url': {
    url: '/api/song/enhance/play/mv/url',
    crypto: 'weapi',
    desc: 'MV地址',
    params: ['id', 'r'],
  },
  'mv/detail': {
    url: '/api/mv/detail',
    crypto: 'weapi',
    desc: 'MV详情',
    params: ['mvid'],
  },
  'mv/first': {
    url: '/api/mv/first',
    crypto: 'linuxapi',
    desc: '最新MV',
    params: ['limit', 'area'],
  },
  'mv/all': {
    url: '/api/mv/all',
    crypto: 'weapi',
    desc: '全部MV',
    params: ['limit', 'offset', 'area', 'type', 'order'],
  },
  'mv/exclusive/rcmd': {
    url: '/api/mv/exclusive/rcmd',
    crypto: 'weapi',
    desc: '网易独家MV',
    params: ['limit', 'offset'],
  },

  // ==================== 评论 ====================
  'comment/music': {
    url: (q) => '/api/v1/resource/comments/R_SO_4_' + q.id,
    crypto: 'weapi',
    desc: '歌曲评论',
    params: ['id', 'limit', 'offset', 'before'],
    dataTransform: (query) => ({
      rid: query.id,
      limit: parseInt(query.limit || 20),
      offset: parseInt(query.offset || 0),
      beforeTime: query.before || 0,
    }),
  },
  'comment/hot': {
    url: (q) => {
      const types: Record<string, string> = { 0: 'R_SO_4_', 1: 'R_MV_5_', 2: 'A_PL_0_', 3: 'R_AL_3_', 4: 'R_VI_62_' };
      const type = types[q.type || 0] || 'R_SO_4_';
      return '/api/v1/resource/hotcomments/' + type + q.id;
    },
    crypto: 'weapi',
    desc: '热门评论',
    params: ['id', 'type', 'limit', 'offset'],
    dataTransform: (query) => ({
      limit: parseInt(query.limit || 20),
      offset: parseInt(query.offset || 0),
      beforeTime: query.before || 0,
    }),
  },
  'comment/playlist': {
    url: (q) => '/api/v1/resource/comments/A_PL_0_' + q.id,
    crypto: 'weapi',
    desc: '歌单评论',
    params: ['id', 'limit', 'offset'],
    dataTransform: (query) => ({
      rid: query.id,
      limit: parseInt(query.limit || 20),
      offset: parseInt(query.offset || 0),
    }),
  },
  'comment/album': {
    url: (q) => '/api/v1/resource/comments/R_AL_3_' + q.id,
    crypto: 'weapi',
    desc: '专辑评论',
    params: ['id', 'limit', 'offset'],
    dataTransform: (query) => ({
      rid: query.id,
      limit: parseInt(query.limit || 20),
      offset: parseInt(query.offset || 0),
    }),
  },
  'comment/mv': {
    url: (q) => '/api/v1/resource/comments/R_MV_5_' + q.id,
    crypto: 'weapi',
    desc: 'MV评论',
    params: ['id', 'limit', 'offset'],
    dataTransform: (query) => ({
      rid: query.id,
      limit: parseInt(query.limit || 20),
      offset: parseInt(query.offset || 0),
    }),
  },
  'comment/like': {
    url: '/api/v1/comment/like',
    crypto: 'weapi',
    desc: '点赞评论',
    params: ['id', 'cid', 't', 'type'],
  },
  'comment/event': {
    url: '/api/v1/comment/event',
    crypto: 'weapi',
    desc: '动态评论',
    params: ['threadId', 'limit', 'offset'],
  },

  // ==================== 推荐 ====================
  'recommend/songs': {
    url: '/api/v3/discovery/recommend/songs',
    crypto: 'weapi',
    desc: '每日推荐歌曲',
    params: [],
  },
  'recommend/resource': {
    url: '/api/discovery/recommend/resource',
    crypto: 'weapi',
    desc: '推荐歌单',
    params: ['limit', 'offset'],
  },
  'personalized': {
    url: '/api/personalized/playlist',
    crypto: 'weapi',
    desc: '推荐歌单',
    params: ['limit', 'offset'],
  },
  'personalized/newsong': {
    url: '/api/personalized/newsong',
    crypto: 'weapi',
    desc: '推荐新音乐',
    params: ['limit', 'offset', 'area'],
  },
  'personalized/djprogram': {
    url: '/api/personalized/djprogram',
    crypto: 'weapi',
    desc: '推荐播客',
    params: [],
  },
  'personalized/mv': {
    url: '/api/personalized/mv',
    crypto: 'weapi',
    desc: '推荐MV',
    params: [],
  },

  // ==================== 排行榜 ====================
  'toplist': {
    url: '/api/toplist',
    crypto: 'linuxapi',
    desc: '所有排行榜',
    params: [],
  },
  'toplist/detail': {
    url: '/api/toplist/detail',
    crypto: 'weapi',
    desc: '排行榜详情',
    params: [],
  },
  'top/list': {
    url: '/api/v3/top/list',
    crypto: 'weapi',
    desc: '排行榜歌曲列表',
    params: ['id'],
  },
  'top/artists': {
    url: '/api/toplist/artist',
    crypto: 'weapi',
    desc: '热门歌手',
    params: ['limit', 'offset'],
  },
  'top/song': {
    url: '/api/discovery/new/songs',
    crypto: 'weapi',
    desc: '新歌速递',
    params: ['type', 'area'],
  },
  'top/album': {
    url: '/api/v1/album/newest',
    crypto: 'weapi',
    desc: '新碟上架',
    params: ['limit', 'offset'],
  },

  // ==================== 首页 ====================
  'banner': {
    url: '/api/v2/banner/get',
    crypto: 'linuxapi',
    desc: 'Banner',
    params: ['clientType'],
  },
  'homepage/block/page': {
    url: '/api/homepage/block/page',
    crypto: 'weapi',
    desc: '首页区块',
    params: ['refresh'],
  },
  'homepage/dragon/ball': {
    url: '/api/homepage/dragon/ball/static',
    crypto: 'weapi',
    desc: '首页快捷入口',
    params: [],
  },

  // ==================== 私人FM ====================
  'personal_fm': {
    url: '/api/v1/radio/get',
    crypto: 'weapi',
    desc: '私人FM',
    params: [],
  },
  'fm_trash': {
    url: '/api/radio/trash/add',
    crypto: 'weapi',
    desc: '私人FM垃圾桶',
    params: ['songId'],
  },
  'like': {
    url: '/api/radio/like',
    crypto: 'weapi',
    desc: '喜欢音乐',
    params: ['trackid', 'like', 'time'],
  },
  'likelist': {
    url: '/api/likelist/get',
    crypto: 'weapi',
    desc: '喜欢列表',
    params: ['uid'],
  },

  // ==================== 视频 ====================
  'video/url': {
    url: '/api/cloudvideo/playurl',
    crypto: 'weapi',
    desc: '视频地址',
    params: ['id', 'resolution'],
  },
  'video/detail': {
    url: '/api/cloudvideo/v1/video/detail',
    crypto: 'weapi',
    desc: '视频详情',
    params: ['id'],
  },
  'video/group': {
    url: '/api/v1/video/group',
    crypto: 'weapi',
    desc: '视频标签列表',
    params: ['id', 'offset'],
  },
  'video/group/list': {
    url: '/api/video/group/list',
    crypto: 'weapi',
    desc: '视频标签',
    params: [],
  },
  'video/timeline/all': {
    url: '/api/v2/video/timeline/all',
    crypto: 'weapi',
    desc: '所有视频',
    params: ['offset'],
  },
  'video/timeline/recommend': {
    url: '/api/v2/video/timelinerecommend',
    crypto: 'weapi',
    desc: '推荐视频',
    params: ['offset'],
  },

  // ==================== 电台/DJ ====================
  'dj/program': {
    url: '/api/dj/program/byradio',
    crypto: 'weapi',
    desc: '电台节目',
    params: ['radioId', 'limit', 'offset', 'asc'],
  },
  'dj/catelist': {
    url: '/api/djradio/category/get',
    crypto: 'weapi',
    desc: '电台分类',
    params: [],
  },
  'dj/hot': {
    url: '/api/djradio/hot/v1',
    crypto: 'weapi',
    desc: '热门电台',
    params: ['limit', 'offset'],
  },
  'dj/detail': {
    url: '/api/djradio/get',
    crypto: 'weapi',
    desc: '电台详情',
    params: ['rid'],
  },
  'dj/sublist': {
    url: '/api/djradio/subed',
    crypto: 'weapi',
    desc: '订阅电台列表',
    params: ['limit', 'offset'],
  },
  'dj/recommend': {
    url: '/api/djradio/recommend/v1',
    crypto: 'weapi',
    desc: '推荐电台',
    params: [],
  },
  'dj/sub': {
    url: '/api/djradio/sub',
    crypto: 'weapi',
    desc: '订阅电台',
    params: ['rid', 't'],
  },
  'dj/program/detail': {
    url: '/api/dj/program/detail',
    crypto: 'weapi',
    desc: '电台节目详情',
    params: ['id'],
  },
  'dj/program/toplist': {
    url: '/api/program/toplist/v1',
    crypto: 'weapi',
    desc: '电台节目榜',
    params: ['limit', 'offset'],
  },
  'dj/toplist/pay': {
    url: '/api/djradio/toplist/pay',
    crypto: 'weapi',
    desc: '付费精品榜',
    params: ['limit', 'offset'],
  },
  'dj/toplist': {
    url: '/api/djradio/toplist/v1',
    crypto: 'weapi',
    desc: '电台榜',
    params: ['limit', 'offset'],
  },
  'dj/toplist/newcomer': {
    url: '/api/djradio/toplist/newcomer/v1',
    crypto: 'weapi',
    desc: '新晋电台榜',
    params: ['limit', 'offset'],
  },
  'dj/catelist/confirm': {
    url: '/api/dj/category/confirm',
    crypto: 'weapi',
    desc: '电台分类推荐',
    params: ['id'],
  },

  // ==================== 其他 ====================
  'daily_signin': {
    url: '/api/point/daily',
    crypto: 'weapi',
    desc: '每日签到',
    params: ['type', 'android', 'ios'],
  },
  'event': {
    url: '/api/event/get',
    crypto: 'weapi',
    desc: '动态',
    params: ['pagesize', 'lasttime'],
  },
  'setting': {
    url: '/api/user/setting',
    crypto: 'weapi',
    desc: '用户设置',
    params: [],
  },
  'cellphone/existence': {
    url: '/api/cellphone/existence',
    crypto: 'weapi',
    desc: '检查手机号是否注册',
    params: ['cellphone'],
  },
  'topic/detail': {
    url: '/api/v1/topic/detail',
    crypto: 'weapi',
    desc: '话题详情',
    params: ['actid'],
  },
  'topic/detail/event': {
    url: '/api/v1/topic/detail/event',
    crypto: 'weapi',
    desc: '话题动态',
    params: ['actid', 'limit', 'offset'],
  },
  'topic/sublist': {
    url: '/api/topic/sublist',
    crypto: 'weapi',
    desc: '收藏的话题',
    params: ['limit', 'offset'],
  },
  'calendar': {
    url: '/api/calendar',
    crypto: 'weapi',
    desc: '音乐日历',
    params: ['startTime', 'endTime'],
  },
  'style': {
    url: '/api/music/style/catalogue',
    crypto: 'weapi',
    desc: '曲风分类',
    params: [],
  },
  'style/tag/song': {
    url: '/api/style/tag/song',
    crypto: 'weapi',
    desc: '曲风歌曲',
    params: ['tagId', 'limit', 'offset'],
  },
  'style/tag/playlist': {
    url: '/api/style/tag/playlist',
    crypto: 'weapi',
    desc: '曲风歌单',
    params: ['tagId', 'limit', 'offset'],
  },
  'playlist/video': {
    url: '/api/playlist/video/list',
    crypto: 'weapi',
    desc: '歌单视频',
    params: ['id', 'limit', 'offset'],
  },
  'mlog/url': {
    url: '/api/mlog/url',
    crypto: 'weapi',
    desc: 'Mlog地址',
    params: ['id'],
  },
  'mlog/to/video': {
    url: '/api/mlog/to/video',
    crypto: 'weapi',
    desc: 'Mlog转视频',
    params: ['id'],
  },
  'related/playlist': {
    url: '/api/discovery/playlist/recommend',
    crypto: 'linuxapi',
    desc: '相关歌单推荐',
    params: ['songid'],
  },
  'simi/song': {
    url: '/api/v1/discovery/simiSong',
    crypto: 'weapi',
    desc: '相似音乐',
    params: ['songid', 'limit', 'offset'],
  },
  'simi/playlist': {
    url: '/api/discovery/simiPlaylist',
    crypto: 'weapi',
    desc: '相似歌单',
    params: ['songid', 'limit', 'offset'],
  },
  'simi/user': {
    url: '/api/discovery/simiUser',
    crypto: 'weapi',
    desc: '相似用户',
    params: ['songid', 'limit', 'offset'],
  },
  'simi/artist': {
    url: '/api/discovery/simiArtist',
    crypto: 'weapi',
    desc: '相似歌手',
    params: ['artistid'],
  },
  'simi/mv': {
    url: '/api/discovery/simiMV',
    crypto: 'weapi',
    desc: '相似MV',
    params: ['mvid'],
  },
  'digitalAlbum/purchased': {
    url: '/api/digitalAlbum/purchased',
    crypto: 'weapi',
    desc: '已购数字专辑',
    params: ['limit', 'offset'],
  },
  'digitalAlbum/ordering': {
    url: '/api/digitalAlbum/ordering',
    crypto: 'weapi',
    desc: '数字专辑订单',
    params: ['paymentMethod', 'id'],
  },
  'yunbei': {
    url: '/api/v1/user/yunbeilogs',
    crypto: 'weapi',
    desc: '云贝记录',
    params: ['limit', 'offset'],
  },
  'yunbei/sign': {
    url: '/api/point/daily',
    crypto: 'weapi',
    desc: '云贝签到',
    params: [],
  },
  'yunbei/task': {
    url: '/api/v1/yunbei/task',
    crypto: 'weapi',
    desc: '云贝任务',
    params: [],
  },
  'yunbei/task/todo': {
    url: '/api/v1/yunbei/task/todo',
    crypto: 'weapi',
    desc: '云贝待办任务',
    params: [],
  },
  'music/first': {
    url: '/api/music/first/info',
    crypto: 'weapi',
    desc: '音乐首唱会',
    params: ['id'],
  },
}
