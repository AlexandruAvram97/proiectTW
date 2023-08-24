const express=require('express');
const path= require("path");
const sass = require('sass');
const fs=require('fs');
const sharp=require('sharp');

obGlobal={
    erori:[],
    obImagini:[],
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
    optiuniMeniu:[]
}

app=express()
console.log("Directorul curent:",__dirname);
console.log("Fisierul curent:",__filename);
console.log("Folder lucru:", process.cwd());

vectFoldere=["temp","temp1", "backup", "poze_uploadate"];
for(let folder of vectFoldere){
    let cale=path.join(__dirname, folder);
    if (!fs.existsSync(cale)){
        fs.mkdirSync(cale);
    }
}


app.set("view engine","ejs");


app.use("/resurse", express.static(path.join(__dirname,"resurse")));
app.use("/node_modules", express.static(path.join(__dirname,"node_modules")));



app.use("/ceva", function(req, res, next){
    console.log("aici");
    next();
})



app.get("/favicon.ico", function(req, res, next){
    res.sendFile(path.join(__dirname,"/resurse/ico/favicon.ico"))
})


app.get(["/", "/index", "/home"], function(req, res){
    res.render("pagini/index", {ip:req.ip, imagini: obGlobal.obImagini.imagini});
});

app.get("/ceva", function(req, res){
    res.send("altceva");
});



function compileazaScss(caleScss, caleCss) {
    // console.log("cale:", caleCss);
    if(!caleCss){
        // let vectorCale = caleScss.split("\\");
        // let numeFisExt = vectorCale[vectorCale.length - 1];
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }
    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss); //incerc sa il caut in locul unde stiu ca avem toate sassurile
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss);
    // let vectorCale = caleCss.split("\\");
    // numeFisCss = vectorCale[vectorCale.length - 1];

    let numeFisCss = path.basename(caleCss);
    if(fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, numeFisCss)) //verific daca nu cumva e in folderul css, ii fac copie in backup ca sa nu suprascriu ceva important
    }
    rez = sass.compile(caleScss, {sourceMap: true}); //transforma scss in css. am obtinut stringul css
    fs.writeFileSync(caleCss, rez.css)
}

vFisiere = fs.readdirSync(obGlobal.folderScss); //citeste fisierele din folderul scss (vectorul de fisiere)
for(let numeFis of vFisiere) {
    if(path.extname(numeFis) === ".scss") {
        compileazaScss(numeFis); //daca e scss, atunci compilam scss (aici putem adauga data modificarii)
    }
}

//daca modific un fisier scss, el verific incontinuu daca sunt modificate - "watch it"
fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    console.log(eveniment, numeFis);
    // if(numeFis[numeFis.length - 1] === "~" || path.extname(numeFis) !== "scss")
    //     return;
    if(eveniment === "change" || eveniment === "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if(fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
})









function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse","json","erori.json")).toString("utf8")
    //console.log(continut);
    let obJson=JSON.parse(continut)
    console.log(obJson.eroare_default)
    for (let eroare of obJson.info_erori){
        eroare.imagine=obJson.cale_baza+"/"+eroare.imagine
    }
    obGlobal.erori=obJson
    obJson.eroare_default.imagine=obJson.cale_baza+"/"+obJson.eroare_default.imagine
}

initErori();


function initImagini(){
    var continut=fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    let caleAbsMic=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mic");
    if(!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    if(!fs.existsSync(caleAbsMic))
        fs.mkdirSync(caleAbsMic);
    for(let imag of vImagini){
        [numeFis, exr]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        let caleFisMicAbs=path.join(caleAbsMic, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        sharp(caleFisAbs).resize(200).toFile(caleFisMicAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu", numeFis+".webp")
        imag.fisier_mic=path.join("/", obGlobal.obImagini.cale_galerie, "mic", numeFis+".webp")
        imag.fisier=path.join("/",obGlobal.obImagini.cale_galerie, imag.fisier);
       

    }
}

initImagini();



function afisEroare(res, _identificator=-1, _titlu, _text, _imagine){
    let vErori=obGlobal.erori.info_erori
    let eroare= vErori.find(function(el){return el.identificator==_identificator})
    if(eroare){
        let titlu1= _titlu || eroare.titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status){
            res.status(_identificator).render("pagini/eroare",{titlu:titlu1, text:text1, imagine:imagine1})
        
        }
        else{
            res.render("pagini/eroare",{titlu:titlu1, text:text1, imagine:imagine1})
        }
    }
    else{
        let errDefault=obGlobal.erori.eroare_default
        let titlu1= _titlu || errDefault.titlu;
        let text1= _text || errDefault.text;
        let imagine1= _imagine || errDefault.imagine;
        res.render("pagini/eroare",{titlu:titlu1, text:text1, imagine:imagine1})
    }
}

app.get("/*.ejs", function(req, res){
    afisEroare(res, 400);
})


app.get("/*", function(req, res){
    if(req.url.match(/^\/resurse(\/[a-zA-Z0-9]*)*\/?/g)){
        afisEroare(res, 403);
        return
    }
    try{
        res.render("pagini"+req.url, function (err, rezultatRandare){
            // console.log("Eroare", err);
            // console.log("Rezultat randare", rezultatRandare);
            // console.log("chei\n", Object.keys(err));
            // console.log("valori\n", Object.values(err));
            // console.log("Mesaj:", err.message);
            // console.log("Proprietati", Object.getOwnPropertyNames(err));
            if(err){
                console.log("Eroare", err);
                if(err.message.startsWith("Failed to lookup view")){
                    afisEroare(res, 404);
                }
                else
                    afisEroare(res);
            }

            else{
                res.send(rezultatRandare);
            }
        })
    }
    catch(err){
        if(err){
            console.log("Eroare", err);
            if(err.message.startsWith("Cannot find module")){
                afisEroare(res);
            }else
                afisEroare(res);
        }
    }
    console.log("cerere generala:", req.url)
});



app.listen(8080);
console.log("A pornit aplicatia");

