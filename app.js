

async function getRepos(org, n){// returns a promise which resolves with a list of top m forked repos of organisation named org 
  
  let data = []  ; 
  let pagesRemaining = true ; // denotes whether more pages have to be extracted
  let no_of_repos_per_page = Math.min(100, n) 
  let page_no = 1 

  while (pagesRemaining){
  
    let url =  `https://api.github.com/search/repositories?q=user:${org}&sort=forks&per_page=${no_of_repos_per_page}&page=${page_no}`
    const response = await fetch(url)  // fetch api request 
    const json = await response.json() // parsing response to json
    
    data = data.concat(json.items)  // adding new repos fetched
    
    n -= json.items.length
    no_of_repos_per_page = Math.min(100,n) 
    page_no += 1 
    if (n <= 0){pagesRemaining = false; } // checking if more repos have to be fetched 
  }

  return data ; 

} 

async function get_oldest_forks(repo_name, org, m){
// returns a promise which resolves with a list of n oldest forks of repo names repo_name, of organisation named org 
  const url = `https://api.github.com/repos/${org}/${repo_name}/forks?sort=oldest` 
  const response = await fetch(url)   
  
  const json = await response.json()
  // console.log("logging pre json res ", json)
  const forks = json.slice(0,Math.min(m,json.length)) 

  return forks 

}


// the forks data is not paginated due to some issue with cors headers as mentioned in readme

// async function get_oldest_forks(repo_name, org, m){
//   // returns a promise which resolves with a list of n oldest forks of repo names repo_name, of organisation named org 
//   let data = []  ;
//   let pagesRemaining = true ; 
//   let no_of_forks_per_page = Math.min(100, m)  
//   let page_no = 1

//   while (pagesRemaining){
//     // console.log("fetching from ", url)
//     let url = `https://api.github.com/repos/${org}/${repo_name}/forks?sort=oldest&per_page=${no_of_forks_per_page}&page=${page_no}`
//     const response = await fetch(url, {mode: 'no-cors'})  
//     console.log("logging pre json response", response)
//     const json = await response.json()
    
//     data = data.concat(json.items)  
    
//     m -= json.items.length
//     no_of_repos_per_page = Math.min(100,m) 
//     page_no += 1 
//     if (n <= 0){pagesRemaining = false; } 
//   }

//   return data ; 


// }

async function get_oldest_forkers(repo_name, org, m){
// returns a promise which resolves with a list of n oldest forkers of repo names repo_name, of organisation named org 
  const oldest_forks = await get_oldest_forks(repo_name, org, m)
  const oldest_forkers = oldest_forks.map((fork) => {
    let fork_entry = {owner :fork.owner, url: fork.svn_url} ; // atributes of each forker
    return fork_entry ; 
  }
  ) 

  return oldest_forkers ;
} 


async function setup(org, n, m){ 
  // returns a promise which resolves to a list which has the following str- 
  // list of objects, each of which has attributes of repos. the forks attribute is a list of objects
  // each of which has user info about the forker 
  let final_data = [] ;
  let repo_entry = {} ;
  let response = await getRepos(org, n) // getting repos


  for (repo of response){
    repo_entry = {} // setting attributes of each repo 
    repo_entry.name = repo.name 
    repo_entry.desc = repo.description
    repo_entry.url = repo.url 
    repo_entry.forks_count = repo.forks_count

    forkers_list = await get_oldest_forkers(repo.name, org, m) // getting forks 
    
    repo_entry.forks = forkers_list ; 

    final_data.push(repo_entry) ; 
  }

    

    return final_data ; 
} 

function make_forkers_list(list){ // helper function to make a DOM list of forks of each repo
  // using a list of forks as obtained from setup
  const list_of_forks = document.createElement("ol"); 
  
  for (let entry of list){
    let list_item = document.createElement("li") 
    let link_to_repo = document.createElement("a") 
    
    link_to_repo.setAttribute("href", entry.url) 
    link_to_repo.setAttribute("target", "_blank")  

    link_to_repo.textContent = entry.owner.login 
    list_item.appendChild(link_to_repo) 
    list_of_forks.appendChild(list_item) 
  }
  return list_of_forks 
} 

async function render(){ // function to finally render all the html 

     
      const form = document.querySelector("form") 
      const no_of_repo_form = document.querySelector("input#top-repos") ; 
      const no_of_forks_form = document.querySelector("input#oldest-forks") 
      const org_form = document.querySelector("select")
      

      form.addEventListener("submit", (e) => { // runs whenever the fetch button is clicked
        e.preventDefault() ; 
        const data_node = document.querySelector("div#data") ; 
        data_node.innerHTML = "fetching" 
        const n = parseInt(no_of_repo_form.value) ; 
        const m = parseInt(no_of_forks_form.value) ;

        if (n < 0  || isNaN(n) || m < 0 || isNaN(m)){ // if an error results due to invalid data
          
          data_node.textContent = "enter valid data" 
        }
        else{
        setup(org_form.value, n, m).then((fetch_data) => { // fetch_data has structure as described above

        data_node.innerHTML = "" 
        const list_of_repos = document.createElement("ol") 

        for (let entry of fetch_data){
          const doc_frag2 = document.createDocumentFragment() ; 
          let list_item = document.createElement("li") 
          let node = document.createElement("div") ;

          const name_node = document.createElement("h3") // name of the repo 
          name_node.innerText = entry.name 
          doc_frag2.appendChild(name_node) 

          let link_node = document.createElement("a") // link to the repo
          link_node.setAttribute("href", entry.url) 
          link_node.setAttribute("target", "_blank") 
          link_node.textContent = entry.url 
          doc_frag2.appendChild(link_node) 

          let desc_node = document.createElement("p") ; // description of repo 
          desc_node.textContent = entry.desc  
          doc_frag2.appendChild(desc_node) 

          let fork_count = document.createElement("h4") ;  // no of forks
          fork_count.textContent = "forks: " + entry.forks_count  
          doc_frag2.appendChild(fork_count) 
          
          let forkers_list = make_forkers_list(entry.forks) // list of forkers 
          doc_frag2.appendChild(forkers_list) 
          node.appendChild(doc_frag2) 
          list_item.appendChild(node)  

          list_of_repos.appendChild(list_item) 
        }
        data_node.appendChild(list_of_repos) 
      }) 


    }
  }
    
    )
    return 

}

function init() { // initialising the render function  
  render().then(() => {return;} )
  .catch((err) => {console.error(err)
    const data_node = document.querySelector("div#data") ; 
    data_node.innerHTML = "Some error was encountered. Please try again later." 
    
  })   
}

init() ;