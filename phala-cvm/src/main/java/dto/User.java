package dto;

import java.util.ArrayList;

public class User {

    ArrayList<Double> member;

    ArrayList<Double> judge;

    public ArrayList<Double> getMember() {
        return member;
    }

    public void setMember(ArrayList<Double> member) {
        this.member = member;
    }

    public ArrayList<Double> getJudge() {
        return judge;
    }

    public void setJudge(ArrayList<Double> judge) {
        this.judge = judge;
    }
}
