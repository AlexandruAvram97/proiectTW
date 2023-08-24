function f(){
    var a=10,b=20;
    let c=30,d=40;
    {
        let a=50
        a++;b++
        let c=60
        c++;d++
        console.log("in bloc: a=",a,"b=",b,"c=",c,"d=",d)
    }
    console.log("in bloc: a=",a,"b=",b,"c=",c,"d=",d)
    console.log("w=",w)
}
w=20
f()



