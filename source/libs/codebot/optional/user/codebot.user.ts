/// <reference path="../../codebot.ts" />

/** User represents the person viewing the web page. */
class User {
    private title = "";
    private timer = 0;
    private methods = ["/?method=login", "/?method=logout"];

    /** Get or set the url to execute for logging into the web page. */
    get loginMethod() : string {
        return this.methods[0];
    }

    set loginMethod(value : string) {
        this.methods[0] = value;
    }

    /** Get or set the url to execute for logging out of the web page. */
    get logoutMethod() : string {
        return this.methods[1];
    }

    set logoutMethod(value : string) {
        this.methods[1] = value;
    }

    /** Log into a domain given a username and password.
     * @param name The name of the user.
     * @param password The password for the user.
     * @param complete A optional callback containing true if login was a success. 
     */
    login(name?: string, password?: string, complete?: Action<boolean>) : void {
        let data = {
            name: name ? name : (get("#name") as HTMLInputElement).value,
            password: password ? password : (get("#password") as HTMLInputElement).value,
            redirect: false
        }
        postWebRequest(this.loginMethod, data, (request) => {
            let success = request.response == "OK"; 
            if (complete)
                complete(success);
            else if (success)
                navigate("/");
            else {
                let box = get("#loginWindow");
                if (box) 
                    box.reapplyClass("shake");
                let title = get("#loginTitle");
                if (title) {
                    if (this.title == "")
                    this.title = title.innerHTML;
                    title.innerHTML = "Invalid username or password";
                    if (this.timer)
                        clearTimeout(this.timer);
                    this.timer = setTimeout(() => {
                        title.innerHTML = this.title;
                        this.timer = 0;
                    }, 3500);
                }
            }
        });
    }

    /** Log out of a domain.
     * @param complete An optional callback notifying you when log out has completed. 
     */
    logout(complete?: Proc) : void {
        if (complete)
            sendWebRequest(this.logoutMethod, () =>  complete());
        else
            sendWebRequest(this.logoutMethod, () =>  navigate("/"));
    }

    /** Returns true if the user was not logged in. */
    get isAnynomous() : boolean {
        let s = document.body.getAttribute("data-user");
        return isDefined(s) ? s.toLowerCase() == "anonymous" : false;
    }

    /** Get the name of the current user. If no user exist then "anonymous" is returned.
     */
    get name() : string {
        let s = document.body.getAttribute("data-user");
        if (isDefined(s)) {
            if (s.length == 0)
                return "anonymous";
            if (s.toLowerCase() == "anonymous")
                return "anonymous";
            return s;
        }
        return "anonymous";
    }

    /** Set the name of the current user. */
    set name(value: string)
    {
        document.body.setAttribute("data-user", value);
    }
}

/** The current user. Depends on body "data-user" attribute. */
let user = new User();