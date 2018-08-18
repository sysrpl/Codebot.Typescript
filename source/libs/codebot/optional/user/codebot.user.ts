/** User represents the person viewing the web page. */
class User {
    /** Log into a domain given a username and password.
     * @param name The name of the user.
     * @param password The password for the user.
     * @param complete A callback containing true if login was a success. 
     */
    login(name: string, password: string, complete: Action<boolean>) : void {
        let data = {
            name: name,
            password: password
        }
        postWebRequest("/?method=login", data, (request) =>  complete(request.response == "OK"));
    }

    /** Log out of a domain.
     * @param complete A callback notifying you when log out has completed. 
     */
    logout(complete: Proc) : void {
        sendWebRequest("/?method=logout", () =>  complete());
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