/// <reference path="../../codebot.ts" />

/** User represents the person viewing the web page. */
class User {
    private originalTitle = "";

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
        postWebRequest("/?method=login", data, (request) => {
            let success = request.response == "OK"; 
            if (complete)
                complete(success);
            else if (success)
                location.href = "/";
            else {
                let box = get("#loginWindow");
                if (box) {
                    box.removeClass("shake");
                    setTimeout(() => box.addClass("shake"), 10);
                }
                let title = get("#loginTitle");
                if (title) {
                    if (this.originalTitle == "")
                    this.originalTitle = title.innerHTML;
                    title.innerHTML = "Invalid username or password";
                    setTimeout(() => title.innerHTML = this.originalTitle, 3500);
                }
            }
        });
    }

    /** Log out of a domain.
     * @param complete An optional callback notifying you when log out has completed. 
     */
    logout(complete?: Proc) : void {
        if (complete)
            sendWebRequest("/?method=logout", () =>  complete());
        else
            location.href = "/";
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