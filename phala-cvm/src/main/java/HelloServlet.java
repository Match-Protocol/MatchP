import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import dto.User;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/match")
public class HelloServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String rule = req.getParameter("rule");
        String member = req.getParameter("member");
        resp.setContentType("text/html;charset=utf8");
        JSONObject json = new JSONObject();
        for (int i = 0; i < 10; i++) {
            JSONArray array = new JSONArray();
            array.add(i);
            array.add(20 - i - 1);
            json.put(String.valueOf(i), array);
        }
        resp.getWriter().write(json.toJSONString());
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        //这个打印会显示的出现在tomcat控制台上（服务端）
        BufferedReader reader = req.getReader();
        StringBuilder body = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            body.append(line);
        }
        User user = JSON.parseObject(body.toString(), User.class);
        double score = 0;
        for (Double data : user.getJudge()) {
            score += data * 0.8;
        }
        for (Double data : user.getMember()) {
            score += data * 0.1;
        }

        resp.setContentType("text/html;charset=utf8");
        JSONObject obj = new JSONObject();
        obj.put("score", score);
        resp.getWriter().write(obj.toJSONString());
    }
}
