import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Cookies from "universal-cookie";
import Product from "../../classes/Product";
import { Project } from "../../classes/Project";
import User from "../../classes/User";
import getproducts, { GetProductsResponseType } from "../../functions/getproducts";
import getprojects, { GetProjectsResponseType } from "../../functions/getprojects";
import login, { LoginResponseType } from "../../functions/login";
import { UpdateProduct } from "../../redux/products/actions";
import { UpdateProject } from "../../redux/projects/actions";
import { SelectProject, UpdateToken } from "../../redux/system/actions";
import { UpdateUser } from "../../redux/user/actions";
import { RootStateType } from "../../rootReducer";
import store from "../../store";
import "./Login.css";

const cookies = new Cookies();
interface States {
    username: string;
    password: string;
    remember: boolean;
    errUserName: boolean;
    errPwd: boolean;
    redirectTo: string | undefined;
}

interface Props {
    user: User;
    updateUser: (user: User) => void;
    updateToken: (token: string) => void;
    updateProject: (project: Project) => void;
    updateProduct: (product: Product) => void;
    selectProject: (id: string) => void;
}

function mapStateToProps(state: RootStateType) {
    return {
        user: state.user,
    };
}

function mapDispatchToProps(dispatch: typeof store.dispatch) {
    return {
        updateUser: (user: User) => dispatch(UpdateUser(user)),
        updateToken: (token: string) => dispatch(UpdateToken(token)),
        updateProject: (project: Project) => dispatch(UpdateProject(project)),
        updateProduct: (product: Product) => dispatch(UpdateProduct(product)),
        selectProject: (id: string) => dispatch(SelectProject(id)),
    };
}

class Login extends React.Component<Props, States> {
    errName: HTMLSpanElement | null = null;
    errPwd: HTMLSpanElement | null = null;
    errNameText: string = "";
    errPwdText: string = "";
    inputName: HTMLInputElement | null = null;
    inputPwd: HTMLInputElement | null = null;

    constructor(props: Readonly<Props>) {
        super(props);
        this.state = {
            username: "",
            password: "",
            remember: false,
            errUserName: false,
            errPwd: false,
            redirectTo: undefined,
        };
    }

    loginValidation = () => {
        const regUserName = /^([a-zA-Z0-9_\-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(]?)$/;
        const regPwd = /(?!^[0-9]{8,20}$)(?!^[a-zA-Z]{8,20}$)^[0-9a-zA-Z]{8,20}$/;
        if (this.state.username.length === 0) {
            this.setState({ errUserName: true });
            this.errNameText = "請輸入帳號";
        }
        if (this.state.password.length === 0) {
            this.setState(() => ({ errPwd: true }));
            this.errPwdText = "請輸入密碼";
        }
        if (this.errNameText !== "" || this.errPwdText !== "") {
            return;
        }
        if (!regUserName.test(this.state.username)) {
            this.setState({ errUserName: true });
            this.errNameText = "帳號格式錯誤 (例：abc@xyz.com)";
        }
        if (!regPwd.test(this.state.password)) {
            this.setState({ errPwd: true });
            this.errPwdText = "密碼需包含英文及數字8~20碼";
        }
        if (this.errNameText === "" && this.errPwdText === "") {
            this.login();
        }
    };

    login = async () => {
        login(this.state.username, this.state.password).then(async (res) => {
            if (res.status === 200) {
                const resdata = ((await res.json()) as unknown) as LoginResponseType;
                const token = resdata.token;
                this.props.updateUser(new User(resdata.userdata));
                this.props.updateToken(token);
                getprojects(token).then(async (res) => {
                    if (res.status === 200) {
                        const resdata = ((await res.json()) as unknown) as GetProjectsResponseType;
                        resdata.projects.map((p) => {
                            this.props.updateProject(new Project(p));
                            return null;
                        });
                        this.props.selectProject(resdata.projects[0].project_name);
                        getproducts(token, resdata.projects[0].project_name).then(async (res) => {
                            if (res.status === 200) {
                                const resdata = ((await res.json()) as unknown) as GetProductsResponseType;
                                resdata.products.map((p) => {
                                    this.props.updateProduct(new Product(p));
                                    return null;
                                });
                            }
                        });
                    } else alert("獲取專案清單失敗，請聯繫客服人員 (" + res.status + ")");
                });
                this.setState({ redirectTo: "/products" });
                if (this.state.remember) cookies.set("token", resdata.token);
            } else if (res.status === 404) {
                alert("使用者名稱或密碼錯誤");
            } else {
                alert("伺服器發生錯誤，請聯繫客服中心");
            }
        });
    };

    hideUserNameErrMsg = () => {
        this.setState({ errUserName: false });
        this.errNameText = "";
        if (this.inputName !== null) this.inputName.focus();
    };

    hidePwdErrMsg = () => {
        this.setState({ errPwd: false });
        this.errPwdText = "";
        if (this.inputPwd !== null) this.inputPwd.focus();
    };

    enterKeyPressHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            this.loginValidation();
        }
    };

    render() {
        if (this.props.user.id !== "") {
            return <Redirect to="/products" />;
        }
        return (
            <div className="loginPage">
                <div className="brand">
                    <a href="https://www.jamiecoulter.co.uk" target="_blank" rel="noopener noreferrer">
                        <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/logo.png" alt="" />
                    </a>
                </div>
                <div className="login">
                    <div className="login_title">
                        <span>後台管理登入</span>
                    </div>
                    <div className="login_fields">
                        <div className="login_fields__user">
                            <div className="icon">
                                <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/user_icon_copy.png" alt="" />
                            </div>
                            <input
                                name="username"
                                placeholder="Username"
                                type="email"
                                onChange={(e) => this.setState({ username: e.target.value })}
                                value={this.state.username}
                                autoComplete="off"
                                onFocus={this.hideUserNameErrMsg}
                                ref={(input) => {
                                    this.inputName = input;
                                }}
                                onKeyDown={this.enterKeyPressHandler}
                            />
                            <div className="validation" hidden={!this.state.errUserName}>
                                <span
                                    ref={(span) => {
                                        this.errName = span;
                                    }}
                                    onClick={this.hideUserNameErrMsg}
                                >
                                    {this.errNameText}
                                </span>
                            </div>
                        </div>
                        <div className="login_fields__password">
                            <div className="icon">
                                <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/lock_icon_copy.png" alt="" />
                            </div>
                            <input
                                name="password"
                                placeholder="Password"
                                type="password"
                                onChange={(e) => this.setState({ password: e.target.value })}
                                value={this.state.password}
                                autoComplete="off"
                                onFocus={this.hidePwdErrMsg}
                                ref={(input) => {
                                    this.inputPwd = input;
                                }}
                                onKeyDown={this.enterKeyPressHandler}
                            />
                            <div className="validation">
                                <span
                                    ref={(span) => {
                                        this.errPwd = span;
                                    }}
                                    onClick={this.hidePwdErrMsg}
                                >
                                    {this.errPwdText}
                                </span>
                            </div>
                        </div>
                        <div className="login_fields__remember">
                            <input
                                type="checkbox"
                                id="checkbox"
                                onChange={(e) =>
                                    this.setState({
                                        remember: e.target.checked,
                                    })
                                }
                            />
                            <label htmlFor="checkbox">保持登入狀態</label>
                            <br />
                        </div>
                        <div className="login_fields__submit">
                            <input type="submit" defaultValue="Log In" onClick={this.loginValidation} />
                            <div className="forgot">
                                <a href="/">Forgotten password?</a>
                            </div>
                        </div>
                    </div>
                    <div className="disclaimer">
                        <p>EppBuyer 批貨達人</p>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);
