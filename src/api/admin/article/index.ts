import request from "../../../utils/request";

enum API{
    APPROVED_ARTICLE_URL= '/article/admin/'
}

// 文章审核请求（适配后端 Put + @RequestParam 参数）
export const ReqReviewArticle = (articleId: number, approved: boolean) =>  request.put(`${API.APPROVED_ARTICLE_URL}${articleId}/review?approved=${approved}`);